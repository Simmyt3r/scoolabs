import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile

path = Path(__file__).with_name("build-teacher-model-pack.py")
spec = importlib.util.spec_from_file_location("teacher_pack", path)
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)

class PackChecks(unittest.TestCase):
    def test_verify_checks_length_hash_and_gguf_header(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / "model.gguf"
            data = b"GGUFsample"
            p.write_bytes(data)
            spec = {"name":"model.gguf","bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()}
            pack.verify(p, spec)
            p.write_bytes(b"GGUFbroken")
            with self.assertRaises(ValueError):
                pack.verify(p, spec)
            p.write_bytes(b"BAD!sample")
            spec["sha256"] = hashlib.sha256(p.read_bytes()).hexdigest()
            with self.assertRaisesRegex(ValueError, "GGUF"):
                pack.verify(p, spec)

    def test_archive_rejects_traversal_and_duplicates_before_write(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for names in (["../escape.exe"], ["runtime/llama-server.exe","runtime/LLAMA-SERVER.EXE"], ["/absolute.exe"], ["C:/escape.exe"]):
                archive = root / "test.zip"
                with zipfile.ZipFile(archive, "w") as z:
                    for name in names:
                        z.writestr(name, "fake")
                dest = root / "dest"
                dest.mkdir(exist_ok=True)
                with self.assertRaises(ValueError):
                    pack.extract_runtime(archive, dest)
                self.assertEqual(list(dest.iterdir()), [])

    def test_archive_locates_server(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = root / "test.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("runtime/llama-server.exe", "fake")
                z.writestr("runtime/ggml.dll", "fake")
            dest = root / "out"
            self.assertEqual(pack.extract_runtime(archive, dest), dest / "runtime" / "llama-server.exe")

if __name__ == "__main__":
    unittest.main()
