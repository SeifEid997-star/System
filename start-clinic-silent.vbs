Set WshShell = CreateObject("WScript.Shell")
' Run start-clinic.bat completely silently (0 = hide window)
WshShell.Run chr(34) & WshShell.CurrentDirectory & "\start-clinic.bat" & chr(34), 0, False
