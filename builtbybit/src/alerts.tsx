import React, { useState, useCallback, useMemo, useEffect } from "react";
import { MenuBarExtra, showToast, Toast, open } from "@raycast/api";
import { useAlerts } from "./hooks/useAlerts";
import axios from "axios";
import { showFailureToast } from "@raycast/utils";
import { formatRelativeDate } from "./utils/dateUtils";
import { ALERTS_CACHE_KEY, API_KEY } from "./utils/constants";
import { AlertType, ContentType, ContentTypeURLMap } from "./types/alert";

const MenuCommand: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { alerts, isLoading, setAlerts, cache } = useAlerts(refreshKey);

  useEffect(() => {
    console.log(`MenuCommand Rendered at ${new Date().toISOString()}`);
    console.log(`Current RefreshKey: ${refreshKey}`);
  }, [refreshKey]);

  // Memoize refresh handler
  const handleRefresh = useCallback(() => {
    console.log(`Manual Refresh Triggered at ${new Date().toISOString()}`);

    setRefreshKey((prevKey) => prevKey + 1);
  }, []);

  // Memoize mark all as read handler
  const markAllAsRead = useCallback(() => {
    axios
      .patch("https://api.builtbybit.com/v1/alerts", {
        headers: { Authorization: `Private ${API_KEY}` },
        data: { read: true },
      })
      .then((response) => {
        if (response.status === 200) {
          cache.remove(ALERTS_CACHE_KEY);
          setAlerts([]);
          showToast(Toast.Style.Success, "✅ Marked all alerts as read");
        } else {
          showFailureToast("Failed to mark all alerts as read", { title: response.statusText });
        }
      })
      .catch((error) => {
        if (error instanceof Error) {
          showFailureToast("Error while marking alerts as read", { title: error.message });
        }
      });
  }, [cache, setAlerts]);

  // Memoize alert items
  const alertItems = useMemo(
    () =>
      alerts.map((alert) => {
        const subtitle = formatRelativeDate(alert.alert_date);
        let title = `${alert.username}: ${alert.alert_type}`;
        let url = "https://builtbybit.com/account/alerts";

        if (alert.alert_type === AlertType.REPLY) {
          if (alert.content_type === ContentType.THREAD) {
            title = `${alert.username} replied to a thread`;
          } else if (alert.content_type === ContentType.TICKET) {
            title = `${alert.username} replied to a ticket`;
          } else if (alert.content_type === ContentType.CONVERSATION) {
            title = `${alert.username} replied to a conversation`;
          }
        } else if (alert.alert_type === AlertType.REACTION) {
          title = `${alert.username} reacted to your message`;
        }

        if (alert.content_type in ContentTypeURLMap) {
          url = `${ContentTypeURLMap[alert.content_type as ContentType]}/${alert.content_id}`;
        }

        return (
          <MenuBarExtra.Item key={alert.content_id} title={title} subtitle={subtitle} onAction={() => open(url)} />
        );
      }),
    [alerts],
  );

  // Memoize menu title
  const menuTitle = useMemo(
    () => (isLoading ? "Loading alerts..." : `${alerts.length} Notification${alerts.length !== 1 ? "s" : ""}`),
    [isLoading, alerts.length],
  );

  return (
    <MenuBarExtra icon={{ source: "bbb-icon.png" }} title={menuTitle} isLoading={isLoading}>
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="View All Alerts"
          shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
          onAction={() => open("https://builtbybit.com/account/alerts")}
        />
      </MenuBarExtra.Section>
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title={alerts.length !== 0 ? "Unread Notifications" : "No Unread Notifications"} />
        {alertItems}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Mark All as Read"
          shortcut={{ modifiers: ["cmd"], key: "enter" }}
          onAction={markAllAsRead}
        />
        <MenuBarExtra.Item
          title="Refresh Alerts"
          onAction={handleRefresh}
          shortcut={{ modifiers: ["cmd"], key: "r" }}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
};

export default MenuCommand;
