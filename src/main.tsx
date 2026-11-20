import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import {isTauri} from '@tauri-apps/api/core';
import {getCurrentWebviewWindow} from '@tauri-apps/api/webviewWindow';
import ClassroomProjector from './ClassroomProjector';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isTauri()&&getCurrentWebviewWindow().label==='classroom-projector'?<ClassroomProjector/>:<App/>}</React.StrictMode>
);
