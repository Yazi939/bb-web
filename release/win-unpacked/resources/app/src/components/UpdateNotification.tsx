import React, { useState, useEffect } from 'react';
import { Modal, Button, Progress, Space, Typography } from 'antd';
import { UpdateInfo } from '../types/electron';

const { Text } = Typography;

// Типы уже определены в src/types/electron.ts

const UpdateNotification: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [updateCheckDisabled, setUpdateCheckDisabled] = useState(false);

  useEffect(() => {
    // Проверяем, что API доступен
    if (!window.electronAPI) {
      console.error('Electron API не доступен');
      return;
    }

    // Проверяем, не отключена ли проверка обновлений
    const lastCheckTime = localStorage.getItem('lastUpdateCheck');
    const updateSkipTime = localStorage.getItem('updateSkipTime');
    const currentTime = Date.now();
    
    // Если пользователь нажал "напомнить позже", не проверяем 24 часа
    if (updateSkipTime && currentTime - parseInt(updateSkipTime) < 24 * 60 * 60 * 1000) {
      console.log('Проверка обновлений отложена пользователем');
      setUpdateCheckDisabled(true);
      return;
    }

    // Если последняя проверка была менее 6 часов назад, не проверяем снова
    if (lastCheckTime && currentTime - parseInt(lastCheckTime) < 6 * 60 * 60 * 1000) {
      console.log('Недавно проверялись обновления, пропускаем');
      return;
    }

    // Слушаем события обновлений
    window.electronAPI.onUpdateAvailable((info) => {
      console.log('Доступно обновление:', info);
      
      // Проверяем, не пропускал ли пользователь эту версию
      const skipUpdateVersion = localStorage.getItem('skipUpdateVersion');
      if (skipUpdateVersion === info.version) {
        console.log('Пользователь выбрал не напоминать об этой версии:', info.version);
        return;
      }
      
      setUpdateInfo(info);
      setIsModalVisible(true);
    });

    window.electronAPI.onDownloadProgress((progressObj) => {
      setDownloadProgress(Math.round(progressObj.percent));
    });

    window.electronAPI.onUpdateDownloaded(() => {
      setIsDownloading(false);
      setIsDownloaded(true);
    });

    window.electronAPI.onUpdateError((error) => {
      console.error('Ошибка обновления:', error);
      setIsDownloading(false);
    });

    // Слушаем событие "обновление недоступно"
    if (window.electronAPI.onUpdateNotAvailable) {
      window.electronAPI.onUpdateNotAvailable(() => {
        console.log('Обновления не доступны, приложение актуально');
        localStorage.setItem('lastUpdateCheck', currentTime.toString());
      });
    }

    // Проверяем наличие обновлений при запуске
    if (!updateCheckDisabled) {
      console.log('Проверяем обновления...');
      window.electronAPI.checkForUpdates();
      localStorage.setItem('lastUpdateCheck', currentTime.toString());
    }

    return () => {
      // Очистка слушателей не требуется, так как они привязаны к window.electronAPI
    };
  }, [updateCheckDisabled]);

  const handleUpdate = async () => {
    setIsDownloading(true);
    await window.electronAPI.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI.installUpdate();
  };

  const handleLater = () => {
    // Сохраняем время, когда пользователь нажал "напомнить позже" (24 часа)
    localStorage.setItem('updateSkipTime', Date.now().toString());
    setIsModalVisible(false);
    setUpdateCheckDisabled(true);
  };

  const handleNeverRemind = () => {
    // Сохраняем версию, для которой не нужно напоминать
    if (updateInfo) {
      localStorage.setItem('skipUpdateVersion', updateInfo.version);
    }
    setIsModalVisible(false);
    setUpdateCheckDisabled(true);
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
            <Space style={{ marginTop: 16 }} wrap>
              <Button type="primary" onClick={handleUpdate}>
                Обновить сейчас
              </Button>
              <Button onClick={handleLater}>
                Напомнить позже
              </Button>
              <Button onClick={handleNeverRemind} type="text" size="small">
                Пропустить эту версию
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