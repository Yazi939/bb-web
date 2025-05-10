import React, { useState, useEffect } from 'react';
import { Modal, Button, Progress, Space, Typography } from 'antd';

const { Text } = Typography;

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

declare global {
  interface Window {
    electron: {
      checkForUpdates: () => Promise<void>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
      onDownloadProgress: (callback: (progress: { percent: number }) => void) => void;
      onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
      onUpdateError: (callback: (error: string) => void) => void;
    }
  }
}

const UpdateNotification: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    // Слушаем события обновлений
    window.electron.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setIsModalVisible(true);
    });

    window.electron.onDownloadProgress((progressObj) => {
      setDownloadProgress(Math.round(progressObj.percent));
    });

    window.electron.onUpdateDownloaded(() => {
      setIsDownloading(false);
      setIsDownloaded(true);
    });

    window.electron.onUpdateError((error) => {
      console.error('Ошибка обновления:', error);
      setIsDownloading(false);
    });

    // Проверяем наличие обновлений при запуске
    window.electron.checkForUpdates();

    return () => {
      // Очистка слушателей не требуется, так как они привязаны к window.electron
    };
  }, []);

  const handleUpdate = async () => {
    setIsDownloading(true);
    await window.electron.downloadUpdate();
  };

  const handleInstall = () => {
    window.electron.installUpdate();
  };

  const handleLater = () => {
    setIsModalVisible(false);
  };

  return (
    <Modal
      title="Уважаемый сотрудник Bunker Boats"
      open={isModalVisible}
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

          {!isDownloading && !isDownloaded && (
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleUpdate}>
                Обновить сейчас
              </Button>
              <Button onClick={handleLater}>
                Напомнить позже
              </Button>
            </Space>
          )}

          {isDownloaded && (
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