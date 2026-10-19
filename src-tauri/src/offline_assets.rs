//! Read-only integrity inspection of resources shipped in the desktop installer.
//! There are deliberately no model downloads, user prompts or arbitrary file-path APIs.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{collections::HashSet, fs, fs::File, io::Read, path::{Component, Path}};
use tauri::{path::BaseDirectory, AppHandle, Manager};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    schema_version: u32,
    files: Vec<AssetEntry>,
}
#[derive(Deserialize)]
struct AssetEntry {
    kind: String,
    path: String,
    bytes: u64,
    sha256: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OfflineAssetsStatus {
    verified: bool,
    science_datasets: usize,
    model_installed: bool,
    model_inference_enabled: bool,
    message: String,
}

const REQUIRED_DATASETS: [&str; 5] = [
    "data/elements.json",
    "data/compounds.json",
    "data/physical-constants.json",
    "data/taxonomy.json",
    "data/reference-atlas.json",
];
const REQUIRED_MODEL: [&str; 7] = [
    "model/onnx/model_quantized.onnx",
    "model/tokenizer.json",
    "model/tokenizer_config.json",
    "model/special_tokens_map.json",
    "model/config.json",
    "model/README.md",
    "model/PROVENANCE.json",
];
const WEIGHT_SHA256: &str = "afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1";
const WEIGHT_BYTES: u64 = 22_972_370;

fn hash_file(path: &Path) -> Result<String, String> {
    let mut input = File::open(path).map_err(|e| format!("Cannot open resource: {e}"))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 65_536];
    loop {
        let read = input.read(&mut buffer).map_err(|e| format!("Cannot inspect resource: {e}"))?;
        if read == 0 { break; }
        hasher.update(&buffer[..read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}
fn inspect(base: &Path) -> Result<OfflineAssetsStatus, String> {
    let raw = fs::read_to_string(base.join("manifest.json"))
        .map_err(|_| "Offline installer asset manifest is missing".to_owned())?;
    let manifest: Manifest = serde_json::from_str(&raw)
        .map_err(|_| "Offline installer asset manifest is invalid".to_owned())?;
    if manifest.schema_version != 1 { return Err("Unsupported asset pack version".into()); }
    let expected: HashSet<&str> = REQUIRED_DATASETS.iter().chain(REQUIRED_MODEL.iter()).copied().collect();
    if manifest.files.len() != expected.len() { return Err("Incomplete offline asset pack".into()); }
    let mut seen = HashSet::new();
    for entry in &manifest.files {
        if !expected.contains(entry.path.as_str()) || !seen.insert(entry.path.as_str()) {
            return Err("Unexpected or duplicated bundled resource".into());
        }
        if !entry.path.split('/').all(|part| !part.is_empty() && part != "." && part != "..") ||
            !Path::new(&entry.path).components().all(|component| matches!(component, Component::Normal(_))) {
            return Err("Unsafe resource path in manifest".into());
        }
        let expected_kind = if entry.path.starts_with("data/") { "science" } else { "model" };
        if entry.kind != expected_kind { return Err("Resource type mismatch".into()); }
        let file = base.join(&entry.path);
        let metadata = fs::metadata(&file).map_err(|_| format!("Missing resource: {}", entry.path))?;
        if !metadata.is_file() || metadata.len() != entry.bytes || hash_file(&file)? != entry.sha256 {
            return Err(format!("Resource integrity check failed: {}", entry.path));
        }
        if entry.path == REQUIRED_MODEL[0] && (entry.bytes != WEIGHT_BYTES || entry.sha256 != WEIGHT_SHA256) {
            return Err("Packaged ONNX model is not the audited version".into());
        }
    }
    if seen.len() != expected.len() { return Err("Required offline resources are missing".into()); }
    Ok(OfflineAssetsStatus {
        verified: true,
        science_datasets: REQUIRED_DATASETS.len(),
        model_installed: true,
        model_inference_enabled: false,
        message: "Verified science references and embedding model are installed locally. Model-powered search remains disabled until teaching and low-spec performance validation.".into(),
    })
}

#[tauri::command]
pub fn offline_assets_status(app: AppHandle) -> OfflineAssetsStatus {
    let outcome = app.path()
        .resolve("offline-assets/manifest.json", BaseDirectory::Resource)
        .map_err(|_| "Cannot resolve installed resources".to_owned())
        .and_then(|manifest| {
            manifest.parent().map(inspect)
                .ok_or_else(|| "Invalid installed asset path".to_owned())?
        });
    outcome.unwrap_or_else(|message| OfflineAssetsStatus {
        verified: false,
        science_datasets: 0,
        model_installed: false,
        model_inference_enabled: false,
        message,
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn missing_pack_is_not_reported_as_installed() {
        let tmp = std::env::temp_dir().join(format!("scoolabs-missing-asset-pack-{}", std::process::id()));
        assert!(inspect(&tmp).is_err());
    }
}
