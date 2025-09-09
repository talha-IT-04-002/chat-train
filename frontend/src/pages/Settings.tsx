import { useEffect, useState } from "react";
import { Layout, Header, Card } from "../components";
export default function Settings() {
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem("theme") || "system");
  const [savedTheme, setSavedTheme] = useState(() => localStorage.getItem("theme") || "system");
  const [justSaved, setJustSaved] = useState(false);
  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };
  const isSelected = (value: string) => selectedTheme === value;
  useEffect(() => {
    applyTheme(selectedTheme)
    localStorage.setItem("theme", selectedTheme)
    setSavedTheme(selectedTheme)
    window.dispatchEvent(new Event('themechange'))
    setJustSaved(true)
    const t = setTimeout(() => setJustSaved(false), 1200)
    return () => clearTimeout(t)
  }, [selectedTheme])
  return (
    <Layout>
      <Header 
        title="Settings" 
        subtitle="Personalize your experience and theme preferences"
      />
      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#313F4E]">Appearance</h2>
              <p className="text-sm text-[#64748b] mt-1">Choose how Chat Train looks on your device.</p>
              <div className="mt-3 text-xs text-[#64748b]">
                Current theme: <span className="font-semibold text-[#313F4E]">{savedTheme}</span>
                {justSaved && <span className="ml-2 text-[#40B1DF]">Preferences saved</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${isSelected("light") ? 'border-[#40B1DF] ring-2 ring-[#40B1DF]/20 shadow-md' : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-sm'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[#313F4E]">Light</div>
                    <div className="text-xs text-[#64748b] mt-1">Bright interface</div>
                  </div>
                  <input
                    type="radio"
                    className="mt-1"
                    value="light"
                    checked={selectedTheme === "light"}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  />
                </div>
              </label>
              <label className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${isSelected("dark") ? 'border-[#40B1DF] ring-2 ring-[#40B1DF]/20 shadow-md' : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-sm'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[#313F4E]">Dark</div>
                    <div className="text-xs text-[#64748b] mt-1">Low-light interface</div>
                  </div>
                  <input
                    type="radio"
                    className="mt-1"
                    value="dark"
                    checked={selectedTheme === "dark"}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  />
                </div>
              </label>
              <label className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${isSelected("system") ? 'border-[#40B1DF] ring-2 ring-[#40B1DF]/20 shadow-md' : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-sm'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[#313F4E]">System</div>
                    <div className="text-xs text-[#64748b] mt-1">Match device setting</div>
                  </div>
                  <input
                    type="radio"
                    className="mt-1"
                    value="system"
                    checked={selectedTheme === "system"}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                  />
                </div>
              </label>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}