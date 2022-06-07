import { Detail, Icon, List, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import path from "path";
import { homedir } from "node:os";
import fs from "fs/promises";
import { constants } from "fs";
import { execSync } from "child_process";

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

  // Get the preference value
  const { minutes } = getPreferenceValues();

  // change type to number
  const minutesNumber = Number(minutes);

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

  // get all messages
  const getMessages = async (): Promise<Messages[]> => {
    try {
      // exucute sqlite3 command
      const stdout = execSync(`sqlite3 -json ${ChatDB} < ${path.join(__dirname, "./assets/messages.sql")}`);

      // Parse JSON
      const messages = JSON.parse(Buffer.from(stdout).toString());

      // return messages
      return messages;
    } catch (error) {
      setError({
        title: "Error",
        description: "Could not get messages",
      });
      return [];
    }
  };

  const getMessagesByMinutes = async (messages: Messages[], minutes: number): Promise<Messages[]> => {
    return messages.filter((message) => {
      const date = new Date(message.message_date);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      return diff / 60000 <= minutes;
    });
  };

  useEffect(() => {
    async function run() {
      // if Chat Database is not accessible then set Error
      if (!(await isAccessible())) {
        setError({
          title: "Error",
          description: `
          You need to give Full-Disk access to raycast!
          Go to System Preferences > Security & Privacy > Privacy > Full Disk Access
          `,
        });
        return;
      }

      // get all messages
      const messages = await getMessages();

      // Reduce messages to only the last X minutes
      const messagesByMinutes = await getMessagesByMinutes(messages, minutesNumber);

      console.log(messagesByMinutes);
    }

    run();
  }, []);

  // if error is set show toast
  if (error) {
    return (
      <List navigationTitle={error.title}>
        <List.EmptyView icon={Icon.Hammer} title={error.title} description="" />
      </List>
    );
  }

  return <Detail markdown="Example for proper error handling" />;
}
