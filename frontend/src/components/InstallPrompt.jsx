import { useEffect, useState } from "react";

const DISMISS_KEY = "saferoute-install-dismissed";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (dismissed || isStandalone()) {
      return;
    }

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (!visible || isStandalone()) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <div className="install-banner" role="dialog" aria-label="Install SafeRoute app">
      <div className="install-banner-icon">
        <img src="/icon-192.png" alt="" />
      </div>
      <div className="install-banner-copy">
        <strong>Install SafeRoute</strong>
        <span>Get app-like access, quicker launch, and offline support.</span>
      </div>
      <div className="install-banner-actions">
        <button className="install-banner-btn install-primary" onClick={handleInstall}>
          Install
        </button>
        <button className="install-banner-btn install-secondary" onClick={handleDismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
