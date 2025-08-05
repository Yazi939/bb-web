!include LogicLib.nsh
!include MUI2.nsh
!include FileFunc.nsh
!include WinVer.nsh

!define PRODUCT_NAME "Bunker Boats"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Bunker Boats"
!define PRODUCT_WEB_SITE "http://www.yourwebsite.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\${PRODUCT_NAME}"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

# MUI Settings
!define MUI_WELCOMEPAGE_TITLE_3LINES
!define MUI_FINISHPAGE_TITLE_3LINES
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_NAME}.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Запустить ${PRODUCT_NAME}"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.md"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Открыть README"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Russian"

!macro customInstall
  # Add INetC plugin
  !addplugindir /x86-unicode "nsis-plugins\Plugins\x86-unicode"

  # Check Node.js installation
  ${If} ${AtLeastWin7}
    DetailPrint "Проверка установки Node.js..."
    
    # Check PATH first
    nsExec::ExecToStack 'where node'
    Pop $0
    StrCpy $1 $0
    
    ${If} $1 == ""
      # Check registry
      DetailPrint "Проверка установки Node.js через реестр..."
      ReadRegStr $0 HKLM "SOFTWARE\Node.js" "InstallPath"
      ReadRegStr $1 HKLM "SOFTWARE\Node.js" "Version"
      
      ${If} $0 == ""
        # Node.js not found, offer installation
        MessageBox MB_YESNO|MB_ICONQUESTION "Приложение требует Node.js для работы. Установить Node.js автоматически? (Если вы уверены, что Node.js уже есть, нажмите 'Нет', чтобы пропустить установку)" IDYES install_node IDNO skip_install
        
        install_node:
          DetailPrint "Скачивание Node.js..."
          inetc::get "https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi" "$TEMP\node-install.msi" /END
          Pop $0
          
          ${If} $0 != "OK"
            MessageBox MB_OK|MB_ICONEXCLAMATION "Не удалось скачать Node.js. Пожалуйста, установите его вручную с сайта https://nodejs.org/ или проверьте подключение к интернету."
            Abort
          ${EndIf}
          
          DetailPrint "Установка Node.js..."
          ExecWait 'msiexec /i "$TEMP\node-install.msi" /qn' $1
          
          ${If} $1 != 0
            MessageBox MB_OK|MB_ICONEXCLAMATION "Node.js не был установлен. Пожалуйста, установите его вручную с сайта https://nodejs.org/"
            Abort
          ${EndIf}
          
          DetailPrint "Node.js успешно установлен"
          Delete "$TEMP\node-install.msi"
          
        skip_install:
      ${Else}
        DetailPrint "Node.js уже установлен (по реестру)"
      ${EndIf}
    ${Else}
      DetailPrint "Node.js найден в PATH, установка не требуется"
    ${EndIf}
  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION "Для работы приложения требуется Windows 7 или новее"
    Abort
  ${EndIf}

  # Create shortcuts
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe"
  
  # Write installation info to registry
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\${PRODUCT_NAME}.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoModify" "1"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoRepair" "1"
!macroend

!macro customUnInstall
  # Remove shortcuts
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  
  # Remove registry entries
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
!macroend 