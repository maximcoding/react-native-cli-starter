/**
 * FILE: src/lib/environment-doctor.ts
 * PURPOSE: Environment Doctor - machine preflight checks (section 17)
 * OWNERSHIP: CLI
 * 
 * Implements `rns doctor --env` that checks required tooling for the chosen target.
 * Must fail early with actionable fixes and block destructive commands when critical items are missing.
 */

import { execCommand } from './exec';
import { CliError, ExitCode } from './errors';
import type { RnsTarget } from './types/common';
import type {
  EnvironmentDoctorReport,
  DoctorFinding,
  DoctorCheckId,
} from './types/doctor';

/**
 * Minimum Node.js version required
 */
const MIN_NODE_VERSION = 18;

/**
 * Runs environment doctor checks
 * 
 * @param target - Target platform (expo/bare)
 * @returns Environment doctor report
 */
export function runEnvironmentDoctor(target: RnsTarget): EnvironmentDoctorReport {
  const findings: DoctorFinding[] = [];
  
  // Core checks (always required)
  findings.push(checkNodeVersion());
  findings.push(checkPackageManager('npm'));
  findings.push(checkPackageManager('pnpm'));
  findings.push(checkPackageManager('yarn'));
  findings.push(checkGit());
  
  // Target-specific checks
  if (target === 'expo') {
    findings.push(checkExpoCli());
  } else if (target === 'bare') {
    findings.push(...checkAndroidToolchain());
    findings.push(...checkIosToolchain());
  }
  
  // Categorize findings
  const criticalErrors = findings.filter(f => f.severity === 'error' && !f.passed);
  const warnings = findings.filter(f => f.severity === 'warning' && !f.passed);
  const passed = criticalErrors.length === 0;
  
  return {
    target,
    findings,
    passed,
    criticalErrors,
    warnings,
  };
}

/**
 * Checks Node.js version
 */
function checkNodeVersion(): DoctorFinding {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.replace('v', '').split('.')[0], 10);
    
    if (majorVersion >= MIN_NODE_VERSION) {
      return {
        checkId: 'node.version',
        name: 'Node.js version',
        severity: 'error',
        passed: true,
        value: version,
      };
    } else {
      return {
        checkId: 'node.version',
        name: 'Node.js version',
        severity: 'error',
        passed: false,
        message: `Node.js version ${version} is below minimum required version ${MIN_NODE_VERSION}`,
        fix: `Upgrade Node.js to version ${MIN_NODE_VERSION} or higher. Visit https://nodejs.org/`,
        value: version,
      };
    }
  } catch (error) {
    return {
      checkId: 'node.version',
      name: 'Node.js version',
      severity: 'error',
      passed: false,
      message: 'Failed to check Node.js version',
      fix: 'Ensure Node.js is installed and accessible in PATH',
    };
  }
}

/**
 * Checks if a package manager is installed
 */
function checkPackageManager(pm: 'npm' | 'pnpm' | 'yarn'): DoctorFinding {
  try {
    const result = execCommand(`${pm} --version`, { stdio: 'pipe' });
    const version = result.stdout.trim();
    
    return {
      checkId: `package-manager.installed` as DoctorCheckId,
      name: `${pm} installed`,
      severity: 'info',
      passed: true,
      value: version,
    };
  } catch (error) {
    return {
      checkId: `package-manager.installed` as DoctorCheckId,
      name: `${pm} installed`,
      severity: 'info',
      passed: false,
      message: `${pm} is not installed or not accessible`,
      fix: `Install ${pm}: ${getPackageManagerInstallInstructions(pm)}`,
    };
  }
}

/**
 * Gets package manager install instructions
 */
function getPackageManagerInstallInstructions(pm: 'npm' | 'pnpm' | 'yarn'): string {
  switch (pm) {
    case 'npm':
      return 'npm comes with Node.js. If missing, reinstall Node.js from https://nodejs.org/';
    case 'pnpm':
      return 'npm install -g pnpm';
    case 'yarn':
      return 'npm install -g yarn';
  }
}

/**
 * Checks if git is installed
 */
function checkGit(): DoctorFinding {
  try {
    const result = execCommand('git --version', { stdio: 'pipe' });
    const version = result.stdout.trim();
    
    return {
      checkId: 'git.installed',
      name: 'Git installed',
      severity: 'error',
      passed: true,
      value: version,
    };
  } catch (error) {
    return {
      checkId: 'git.installed',
      name: 'Git installed',
      severity: 'error',
      passed: false,
      message: 'Git is not installed or not accessible',
      fix: 'Install Git: https://git-scm.com/downloads',
    };
  }
}

/**
 * Checks Expo CLI/toolchain
 */
function checkExpoCli(): DoctorFinding {
  try {
    // Check for expo-cli or @expo/cli
    let version: string | null = null;
    
    try {
      const result = execCommand('npx expo --version', { stdio: 'pipe' });
      version = result.stdout.trim();
    } catch {
      try {
        const result = execCommand('expo --version', { stdio: 'pipe' });
        version = result.stdout.trim();
      } catch {
        // Not found
      }
    }
    
    if (version) {
      return {
        checkId: 'expo.cli',
        name: 'Expo CLI',
        severity: 'error',
        passed: true,
        value: version,
      };
    } else {
      return {
        checkId: 'expo.cli',
        name: 'Expo CLI',
        severity: 'error',
        passed: false,
        message: 'Expo CLI is not installed',
        fix: 'Install Expo CLI: npm install -g @expo/cli',
      };
    }
  } catch (error) {
    return {
      checkId: 'expo.cli',
      name: 'Expo CLI',
      severity: 'error',
      passed: false,
      message: 'Failed to check Expo CLI',
      fix: 'Install Expo CLI: npm install -g @expo/cli',
    };
  }
}

/**
 * Checks Android toolchain
 */
function checkAndroidToolchain(): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  
  // Check Android SDK
  findings.push(checkAndroidSdk());
  
  // Check JDK
  findings.push(checkJdk());
  
  // Check adb
  findings.push(checkAdb());
  
  // Check Gradle
  findings.push(checkGradle());
  
  return findings;
}

/**
 * Checks Android SDK
 */
function checkAndroidSdk(): DoctorFinding {
  try {
    const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    
    if (androidHome) {
      return {
        checkId: 'android.sdk',
        name: 'Android SDK',
        severity: 'error',
        passed: true,
        value: androidHome,
      };
    } else {
      return {
        checkId: 'android.sdk',
        name: 'Android SDK',
        severity: 'error',
        passed: false,
        message: 'ANDROID_HOME or ANDROID_SDK_ROOT environment variable is not set',
        fix: 'Install Android Studio and set ANDROID_HOME environment variable. See https://reactnative.dev/docs/environment-setup',
      };
    }
  } catch (error) {
    return {
      checkId: 'android.sdk',
      name: 'Android SDK',
      severity: 'error',
      passed: false,
      message: 'Failed to check Android SDK',
      fix: 'Install Android Studio and set ANDROID_HOME environment variable',
    };
  }
}

/**
 * Checks JDK
 */
function checkJdk(): DoctorFinding {
  try {
    const result = execCommand('java -version', { stdio: 'pipe' });
    const version = result.stderr || result.stdout;
    const versionMatch = version.match(/version\s+"?(\d+)/);
    const majorVersion = versionMatch ? parseInt(versionMatch[1], 10) : null;
    
    if (majorVersion && majorVersion >= 11) {
      return {
        checkId: 'android.jdk',
        name: 'Java JDK',
        severity: 'error',
        passed: true,
        value: version.trim(),
      };
    } else {
      return {
        checkId: 'android.jdk',
        name: 'Java JDK',
        severity: 'error',
        passed: false,
        message: `Java JDK version ${majorVersion || 'unknown'} is below minimum required version 11`,
        fix: 'Install Java JDK 11 or higher. See https://reactnative.dev/docs/environment-setup',
        value: version.trim(),
      };
    }
  } catch (error) {
    return {
      checkId: 'android.jdk',
      name: 'Java JDK',
      severity: 'error',
      passed: false,
      message: 'Java JDK is not installed or not accessible',
      fix: 'Install Java JDK 11 or higher. See https://reactnative.dev/docs/environment-setup',
    };
  }
}

/**
 * Checks adb (Android Debug Bridge)
 */
function checkAdb(): DoctorFinding {
  try {
    const result = execCommand('adb version', { stdio: 'pipe' });
    const version = result.stdout.trim();
    
    return {
      checkId: 'android.adb',
      name: 'Android Debug Bridge (adb)',
      severity: 'error',
      passed: true,
      value: version,
    };
  } catch (error) {
    return {
      checkId: 'android.adb',
      name: 'Android Debug Bridge (adb)',
      severity: 'error',
      passed: false,
      message: 'adb is not installed or not accessible',
      fix: 'Install Android SDK Platform Tools. adb should be in $ANDROID_HOME/platform-tools',
    };
  }
}

/**
 * Checks Gradle
 */
function checkGradle(): DoctorFinding {
  try {
    const result = execCommand('gradle --version', { stdio: 'pipe' });
    const versionMatch = result.stdout.match(/Gradle\s+(\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    
    return {
      checkId: 'android.gradle',
      name: 'Gradle',
      severity: 'error',
      passed: true,
      value: version,
    };
  } catch (error) {
    return {
      checkId: 'android.gradle',
      name: 'Gradle',
      severity: 'warning', // Gradle wrapper might be used instead
      passed: false,
      message: 'Gradle is not installed globally',
      fix: 'Gradle wrapper is typically used. If needed, install Gradle: https://gradle.org/install/',
    };
  }
}

/**
 * Checks iOS toolchain
 * Only runs on macOS - skips on other platforms
 */
function checkIosToolchain(): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  
  // iOS toolchain checks only apply on macOS
  if (process.platform !== 'darwin') {
    // Skip iOS checks on non-macOS platforms
    return findings;
  }
  
  // Check Xcode
  findings.push(checkXcode());
  
  // Check CocoaPods
  findings.push(checkCocoaPods());
  
  return findings;
}

/**
 * Checks Xcode
 */
function checkXcode(): DoctorFinding {
  try {
    const result = execCommand('xcodebuild -version', { stdio: 'pipe' });
    const version = result.stdout.trim();
    
    return {
      checkId: 'ios.xcode',
      name: 'Xcode',
      severity: 'error',
      passed: true,
      value: version,
    };
  } catch (error) {
    return {
      checkId: 'ios.xcode',
      name: 'Xcode',
      severity: 'error',
      passed: false,
      message: 'Xcode is not installed or not accessible',
      fix: 'Install Xcode from the Mac App Store. Also install Xcode Command Line Tools: xcode-select --install',
    };
  }
}

/**
 * Checks CocoaPods
 */
function checkCocoaPods(): DoctorFinding {
  try {
    const result = execCommand('pod --version', { stdio: 'pipe' });
    const version = result.stdout.trim();
    
    return {
      checkId: 'ios.cocoapods',
      name: 'CocoaPods',
      severity: 'error',
      passed: true,
      value: version,
    };
  } catch (error) {
    return {
      checkId: 'ios.cocoapods',
      name: 'CocoaPods',
      severity: 'error',
      passed: false,
      message: 'CocoaPods is not installed or not accessible',
      fix: 'Install CocoaPods: sudo gem install cocoapods',
    };
  }
}

/**
 * Validates environment and throws if critical checks fail
 * 
 * @param target - Target platform
 * @throws CliError if critical environment checks fail
 */
export function validateEnvironment(target: RnsTarget): void {
  const report = runEnvironmentDoctor(target);
  
  if (!report.passed && report.criticalErrors.length > 0) {
    const errorMessages = report.criticalErrors
      .map(err => `  - ${err.name}: ${err.message}\n    Fix: ${err.fix}`)
      .join('\n');
    
    throw new CliError(
      `Environment validation failed. Critical issues found:\n${errorMessages}\n\n` +
      `Run 'rns doctor --env' for full details.`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
}
