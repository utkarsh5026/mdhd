import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { IoSettings, IoEye, IoEyeOff, IoSave, IoTrash } from "react-icons/io5";
import { LLMProviderId, LLMProvider } from "../types";

interface SettingsDropdownProps {
  providers: LLMProvider[];
  getProviderIcon: (providerId: LLMProviderId) => React.ReactNode;
}

interface ApiKeys {
  [providerId: string]: string;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  providers,
  getProviderIcon,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [tempKeys, setTempKeys] = useState<ApiKeys>({});

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys: ApiKeys = {};
    providers.forEach((provider) => {
      const savedKey = localStorage.getItem(`mdhd_apikey_${provider.id}`);
      if (savedKey) {
        savedKeys[provider.id] = savedKey;
      }
    });
    setApiKeys(savedKeys);
    setTempKeys(savedKeys);
  }, [providers]);

  const handleSaveKey = (providerId: string) => {
    const key = tempKeys[providerId] || "";
    if (key.trim()) {
      localStorage.setItem(`mdhd_apikey_${providerId}`, key);
      setApiKeys((prev) => ({ ...prev, [providerId]: key }));
    } else {
      localStorage.removeItem(`mdhd_apikey_${providerId}`);
      setApiKeys((prev) => {
        const updated = { ...prev };
        delete updated[providerId];
        return updated;
      });
    }
  };

  const handleDeleteKey = (providerId: string) => {
    if (confirm("Are you sure you want to delete this API key?")) {
      localStorage.removeItem(`mdhd_apikey_${providerId}`);
      setApiKeys((prev) => {
        const updated = { ...prev };
        delete updated[providerId];
        return updated;
      });
      setTempKeys((prev) => {
        const updated = { ...prev };
        delete updated[providerId];
        return updated;
      });
      setVisibleKeys((prev) => {
        const updated = { ...prev };
        delete updated[providerId];
        return updated;
      });
    }
  };

  const handleToggleVisibility = (providerId: string) => {
    if (!visibleKeys[providerId]) {
      if (confirm("Are you sure you want to view your API key?")) {
        setVisibleKeys((prev) => ({ ...prev, [providerId]: true }));
      }
    } else {
      setVisibleKeys((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const maskKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "*".repeat(key.length);
    return (
      key.substring(0, 4) +
      "*".repeat(key.length - 8) +
      key.substring(key.length - 4)
    );
  };

  const getDisplayValue = (providerId: string) => {
    const key = apiKeys[providerId];
    const tempKey = tempKeys[providerId];

    if (visibleKeys[providerId]) {
      return tempKey || key || "";
    }

    return key ? maskKey(key) : tempKey || "";
  };

  return (
    <DropdownMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <IoSettings className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-96 rounded-2xl border-none shadow-lg font-cascadia-code"
        align="end"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <IoSettings className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">API Keys</h3>
          </div>

          <ScrollArea className="max-h-80">
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getProviderIcon(provider.id as LLMProviderId)}
                    <span className="text-sm font-medium">{provider.name}</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={visibleKeys[provider.id] ? "text" : "password"}
                        placeholder={`Enter ${provider.name} API key...`}
                        value={getDisplayValue(provider.id)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTempKeys((prev) => ({
                            ...prev,
                            [provider.id]: value,
                          }));
                        }}
                        disabled={
                          !visibleKeys[provider.id] && !!apiKeys[provider.id]
                        }
                        className="text-xs h-8 rounded-2xl border-1 border-border bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/30 pr-8"
                      />
                      {apiKeys[provider.id] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(provider.id)}
                          className="absolute right-1 top-0 h-8 w-6 p-0 hover:bg-transparent"
                        >
                          {visibleKeys[provider.id] ? (
                            <IoEyeOff className="w-3 h-3" />
                          ) : (
                            <IoEye className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveKey(provider.id)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      disabled={!tempKeys[provider.id]?.trim()}
                    >
                      <IoSave className="w-3 h-3" />
                    </Button>

                    {apiKeys[provider.id] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(provider.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <IoTrash className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              API keys are stored locally in your browser and never sent to our
              servers.
            </p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsDropdown;
