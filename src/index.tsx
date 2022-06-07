import { Detail, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import path from "path";
import { homedir } from "node:os";
import fs from "fs/promises";
import { constants } from "fs";

interface Messages {
  ROWID: number;
  sender: string;
  service: string;
  message_date: string;
  text: string;
}

interface Error {
  title: string;
  description: string;
}

export default function Command() {
  const [error, setError] = useState<Error>();

  // ChatDB Path
  const ChatDB = path.join(homedir(), "./Library/Messages/chat.db");

  // check if Database is accessible
  const isAccessible = async (): Promise<boolean> => {
    try {
      await fs.access(ChatDB, constants.F_OK | constants.R_OK);
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    async function run() {
      // if Chat Database is not accessible then set Error
      if (!(await isAccessible()))
        setError({
          title: "Error",
          description: "Chat Database is not accessible",
        });
    }

    run();
  }, []);

  // if error is set show toast
  if (error) {
    return (
      <List navigationTitle={error.title}>
        <List.EmptyView
          icon={Icon.Hammer}
          title={error.description}
          description="You need to give Full-Disk access to raycast!
          Go to System Preferences > Security & Privacy > Privacy > Full Disk Access"
        />
      </List>
    );
  }

  return <Detail markdown="Example for proper error handling" />;
}
