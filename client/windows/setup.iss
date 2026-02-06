[Setup]
AppName=Tick
AppVersion=0.1.0
DefaultDirName={autopf}\Tick
DefaultGroupName=Tick
UninstallDisplayIcon={app}\tracker.exe
OutputDir=dist
OutputBaseFilename=TickSetup
Compression=lzma2
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Binaries
Source: "target\release\tracker.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "target\release\configure.exe"; DestDir: "{app}"; Flags: ignoreversion

; Documentation & License
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion

; Assets (if any are needed at runtime)
Source: "assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Tick"; Filename: "{app}\configure.exe"
Name: "{group}\Tick Tracker"; Filename: "{app}\tracker.exe"
Name: "{commondesktop}\Tick"; Filename: "{app}\configure.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\configure.exe"; Description: "Launch Tick Setup"; Flags: nowait postinstall skipifsilent
