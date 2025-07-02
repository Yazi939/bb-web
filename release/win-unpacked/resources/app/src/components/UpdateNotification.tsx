import React, { useState, useEffect } from 'react';
import { Modal, Button, Progress, Space, Typography } from 'antd';
import { DownloadOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import { UpdateInfo } from '../types/electron';

const { Text } = Typography;

declare global {
  interface Window {
    electronAPI?: {
      checkForUpdates: () => void;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => void;
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
      onDownloadProgress: (callback: (info: { percent: number }) => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      onUpdateError: (callback: (error: Error) => void) => void;
      onUpdateNotAvailable?: (callback: () => void) => void;
    };
  }
}

const UpdateNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Проверяем доступность Electron API
    if (!window.electronAPI) {
      console.log('Electron API недоступен - вероятно веб-версия');
      return;
    }

    // Проверяем когда последний раз проверяли обновления
    const lastCheck = localStorage.getItem('lastUpdateCheck');
    const skipTime = localStorage.getItem('updateSkipTime');
    const now = Date.now();
    
    // Если пользователь недавно отклонил обновление, не проверяем 24 часа
    if (skipTime && (now - parseInt(skipTime)) < 24 * 60 * 60 * 1000) {
      console.log('Пользователь недавно отклонил обновление, пропускаем');
      return;
    }

    // Настраиваем обработчики событий
    window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
      console.log('Доступно обновление:', info);
      
      // Проверяем, не отклонил ли пользователь эту версию
      const skipVersion = localStorage.getItem('skipUpdateVersion');
      if (skipVersion === info.version) {
        console.log('Пользователь выбрал не напоминать об этой версии:', info.version);
        return;
      }
      
      setUpdateInfo(info);
      setIsVisible(true);
    });

    window.electronAPI.onDownloadProgress((info: { percent: number }) => {
      setDownloadProgress(Math.round(info.percent));
    });

    window.electronAPI.onUpdateDownloaded(() => {
      setIsDownloading(false);
      setIsReady(true);
    });

    window.electronAPI.onUpdateError((error: Error) => {
      console.error('Ошибка обновления:', error);
      setIsDownloading(false);
    });

    // Обработчик для случая когда обновлений нет
    if (window.electronAPI.onUpdateNotAvailable) {
      window.electronAPI.onUpdateNotAvailable(() => {
        console.log('Обновления не доступны, приложение актуально');
        localStorage.setItem('lastUpdateCheck', now.toString());
      });
    }

    // Проверяем обновления только если не проверяли в этой сессии
    if (!hasChecked) {
      console.log('Проверяем обновления...');
      window.electronAPI.checkForUpdates();
      localStorage.setItem('lastUpdateCheck', now.toString());
    }

    return () => {
      // Cleanup не требуется для большинства Electron API
    };
  }, [hasChecked]);

  const handleUpdate = async () => {
    setIsDownloading(true);
    await window.electronAPI.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI.installUpdate();
  };

  const handleLater = () => {
    setIsVisible(false);
  };

  return (
    <Modal
      title="Уважаемый сотрудник Bunker Boats"
      open={isVisible}
      onCancel={handleLater}
      footer={null}
      closable={!isDownloading}
    >
      {updateInfo && (
        <div>
          <Text>Для приложения доступно обновление версии {updateInfo.version}</Text>
          {updateInfo.releaseNotes && (
            <div style={{ marginTop: 16 }}>
              <Text strong>Что нового в обновлении:</Text>
              <div style={{ marginTop: 8 }}>{updateInfo.releaseNotes}</div>
            </div>
          )}
          
          {isDownloading && (
            <div style={{ marginTop: 16 }}>
              <Progress percent={downloadProgress} />
              <Text>Идет загрузка обновления...</Text>
            </div>
          )}

          {!isDownloading && !isReady && (
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleUpdate}>
                Обновить сейчас
              </Button>
              <Button onClick={handleLater}>
                Напомнить позже
              </Button>
            </Space>
          )}

          {isReady && (
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleInstall}>
                Перезапустить и установить
              </Button>
              <Button onClick={handleLater}>
                Напомнить позже
              </Button>
            </Space>
          )}
        </div>
      )}
    </Modal>
  );
};

export default UpdateNotification; 