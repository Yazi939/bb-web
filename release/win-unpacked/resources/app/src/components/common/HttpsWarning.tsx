import React, { useState } from 'react';
import { Alert, Button, Space, Typography, Collapse, Divider, Steps } from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined, ChromeOutlined, SafetyOutlined, LinkOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface HttpsWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const HttpsWarning: React.FC<HttpsWarningProps> = ({ isVisible, onDismiss }) => {
  const [activeTab, setActiveTab] = useState<string>('1');

  if (!isVisible) return null;

  const isHttps = window.location.protocol === 'https:';
  
  if (!isHttps) return null;

  const httpVersion = 'https://yazi939.github.io/bb-web/';

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.8)', 
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '24px', 
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
            <Title level={3}>Настройка доступа к серверу</Title>
          </div>
          
          <Alert
            message="Mixed Content Error"
            description="HTTPS страница не может подключиться к HTTP серверу из-за политики безопасности браузера"
            type="error"
            showIcon
          />

          <Steps
            current={parseInt(activeTab) - 1}
            items={[
              {
                title: 'HTTP версия',
                description: 'Рекомендуется',
                icon: <LinkOutlined />
              },
              {
                title: 'Настройка браузера',
                description: 'Альтернатива',
                icon: <ChromeOutlined />
              },
              {
                title: 'Разрешить HTTP',
                description: 'Для экспертов',
                icon: <SafetyOutlined />
              }
            ]}
          />

          <Collapse activeKey={activeTab} onChange={(key) => setActiveTab(Array.isArray(key) ? key[0] : key)}>
            <Panel 
              header={
                <Space>
                  <LinkOutlined style={{ color: '#52c41a' }} />
                  <Text strong>Вариант 1: Использовать HTTP версию (Рекомендуется)</Text>
                </Space>
              } 
              key="1"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="Самый простой способ"
                  description="Откройте HTTP версию приложения, которая работает без ограничений"
                  type="success"
                  showIcon
                />
                
                <div style={{ 
                  background: '#f0f9ff', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #91d5ff'
                }}>
                  <Text strong>HTTP версия:</Text>
                  <div style={{ 
                    background: '#fff', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    margin: '8px 0',
                    border: '1px solid #d9d9d9'
                  }}>
                    <a 
                      href={httpVersion} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#1890ff', wordBreak: 'break-all' }}
                    >
                      {httpVersion}
                    </a>
                  </div>
                  <Button 
                    type="primary" 
                    icon={<LinkOutlined />}
                    onClick={() => window.open(httpVersion, '_blank')}
                    style={{ marginTop: '8px' }}
                  >
                    Открыть HTTP версию
                  </Button>
                </div>
              </Space>
            </Panel>

            <Panel 
              header={
                <Space>
                  <ChromeOutlined style={{ color: '#faad14' }} />
                  <Text strong>Вариант 2: Настройка браузера</Text>
                </Space>
              } 
              key="2"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Для Chrome/Edge:</Text>
                <ol style={{ paddingLeft: '20px' }}>
                  <li>Нажмите на значок замка в адресной строке</li>
                  <li>Выберите "Настройки сайта"</li>
                  <li>Найдите "Небезопасный контент" и выберите "Разрешить"</li>
                  <li>Перезагрузите страницу</li>
                </ol>

                <Divider />

                <Text strong>Для Firefox:</Text>
                <ol style={{ paddingLeft: '20px' }}>
                  <li>В адресной строке введите: <code>about:config</code></li>
                  <li>Найдите: <code>security.mixed_content.block_active_content</code></li>
                  <li>Установите значение: <code>false</code></li>
                  <li>Перезагрузите страницу</li>
                </ol>
              </Space>
            </Panel>

            <Panel 
              header={
                <Space>
                  <SafetyOutlined style={{ color: '#ff4d4f' }} />
                  <Text strong>Вариант 3: Разрешить HTTP подключение</Text>
                </Space>
              } 
              key="3"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="Внимание!"
                  description="Этот метод временно снижает безопасность браузера"
                  type="warning"
                  showIcon
                />
                
                <Text strong>Шаги:</Text>
                <ol style={{ paddingLeft: '20px' }}>
                  <li>
                    Перейдите по ссылке: 
                    <div style={{ 
                      background: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      margin: '8px 0'
                    }}>
                      <a 
                        href="http://89.169.170.164:5000/api/health" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1890ff' }}
                      >
                        http://89.169.170.164:5000/api/health
                      </a>
                    </div>
                  </li>
                  <li>Разрешите "небезопасное" подключение</li>
                  <li>Вернитесь и нажмите "Повторить подключение"</li>
                </ol>
              </Space>
            </Panel>
          </Collapse>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Button 
              type="primary" 
              onClick={onDismiss}
              size="large"
            >
              Повторить подключение
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              size="large"
            >
              Перезагрузить страницу
            </Button>
          </Space>
        </Space>
      </div>
    </div>
  );
}; 