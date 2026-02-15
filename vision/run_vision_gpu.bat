@echo off
cd /d "%~dp0"
title AI VISION - PRODUCTION CONTROLLER

:MENU
cls
echo ========================================================
echo   AI VISION - RTX 4050 CONTROLLER
echo ========================================================
echo.
echo   [1] FAST LAUNCH (Default) - Instant Start
echo   [2] FULL REBUILD          - Clean Install
echo.
echo   Waiting 2 seconds...
choice /C 12 /N /T 2 /D 1 /M "Select Option [1/2]: "

IF ERRORLEVEL 2 GOTO :REBUILD
IF ERRORLEVEL 1 GOTO :CHECK_VENV

:CHECK_VENV
IF NOT EXIST "venv\Scripts\python.exe" (
    echo [WARN] Virtual Environment not found.
    echo Please select [2] FULL REBUILD.
    pause
    goto :MENU
)
goto :FAST_LAUNCH

:FAST_LAUNCH
echo [INFO] Fast Launching...
call venv\Scripts\activate
python vision.py
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Execution failed.
    echo Environment incomplete. Run FULL REBUILD.
    pause
)
goto :END

:REBUILD
echo.
echo [INFO] Starting Full Environment Rebuild...
IF EXIST "venv" (
    echo [INFO] Removing old environment...
    rmdir /s /q venv
)

:: Python Detection
set "PY_EXE=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python310\python.exe"
IF NOT EXIST "%PY_EXE%" (
    echo [ERROR] Python 3.10 not found at: %PY_EXE%
    echo Please install Python 3.10 manually.
    pause
    exit /b
)

echo [INFO] Creating venv...
"%PY_EXE%" -m venv venv
call venv\Scripts\activate

echo [INFO] Upgrading PIP...
python -m pip install --upgrade pip

echo [INFO] Step 1: Installing CUDA Torch (cu121)...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

echo [INFO] Step 2: Installing Application Dependencies...
:: Installing from default index to ensure compatibility
pip install ultralytics opencv-python requests pyyaml matplotlib pandas scipy psutil

echo.
echo [INFO] Build Complete. Launching...
goto :FAST_LAUNCH

:END
echo.
echo [INFO] Service Stopped.
pause
