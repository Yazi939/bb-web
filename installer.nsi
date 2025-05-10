!include "installer.nsh"

OutFile "dist\BunkerBoats-Setup.exe"
InstallDir "$PROGRAMFILES\Bunker Boats"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "dist\*.*"
  !insertmacro customInstall
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR"
  !insertmacro customUnInstall
SectionEnd
