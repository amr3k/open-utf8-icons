/**
 * Unit tests for install-prompt helpers (`src/lib/pwa.ts`).
 *
 * These cover the rules that decide whether the banner appears at all and
 * when an installed app should stop offering installation.
 */

import { describe, expect, test } from "bun:test";
import {
  INSTALL_DISMISSED_KEY,
  isIosDevice,
  isStandalone,
  parseInstallDismissed,
  shouldOfferInstall,
} from "./pwa.js";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

describe("parseInstallDismissed", () => {
  test("only treats the explicit flag as dismissed", () => {
    expect(parseInstallDismissed("1")).toBe(true);
    expect(parseInstallDismissed(null)).toBe(false);
    expect(parseInstallDismissed("0")).toBe(false);
    expect(parseInstallDismissed("true")).toBe(false);
    expect(parseInstallDismissed("")).toBe(false);
  });

  test("uses a namespaced storage key", () => {
    expect(INSTALL_DISMISSED_KEY).toBe("utf8:install-dismissed");
  });
});

describe("isStandalone", () => {
  test("is true when either display mode or Safari standalone reports installed", () => {
    expect(isStandalone(true, false)).toBe(true);
    expect(isStandalone(false, true)).toBe(true);
    expect(isStandalone(true, true)).toBe(true);
    expect(isStandalone(false, false)).toBe(false);
  });
});

describe("isIosDevice", () => {
  test("detects iPhone and iPad user agents", () => {
    expect(isIosDevice(IPHONE_UA, "iPhone", 5)).toBe(true);
    expect(isIosDevice(IPAD_UA, "iPad", 5)).toBe(true);
  });

  test("detects iPadOS 13+ despite its macOS user agent", () => {
    expect(isIosDevice(MAC_UA, "MacIntel", 5)).toBe(true);
  });

  test("does not flag desktops or Android devices", () => {
    expect(isIosDevice(MAC_UA, "MacIntel", 0)).toBe(false);
    expect(isIosDevice(ANDROID_UA, "Linux armv8l", 5)).toBe(false);
    expect(isIosDevice(WINDOWS_UA, "Win32", 0)).toBe(false);
  });
});

describe("shouldOfferInstall", () => {
  const base = {
    canPrompt: false,
    ios: false,
    dismissed: false,
    installed: false,
  };

  test("requires a prompt event or the iOS hint", () => {
    expect(shouldOfferInstall(base)).toBe(false);
    expect(shouldOfferInstall({ ...base, canPrompt: true })).toBe(true);
    expect(shouldOfferInstall({ ...base, ios: true })).toBe(true);
  });

  test("never offers install after dismissal or installation", () => {
    expect(
      shouldOfferInstall({ ...base, canPrompt: true, dismissed: true }),
    ).toBe(false);
    expect(
      shouldOfferInstall({ ...base, canPrompt: true, installed: true }),
    ).toBe(false);
    expect(shouldOfferInstall({ ...base, ios: true, dismissed: true })).toBe(
      false,
    );
    expect(shouldOfferInstall({ ...base, ios: true, installed: true })).toBe(
      false,
    );
  });
});
