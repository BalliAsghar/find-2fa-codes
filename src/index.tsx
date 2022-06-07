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
  type: string;
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
        type: "error",
        title: "Error",
        description: "Could not get messages",
      });
      return [];
    }
  };

  const getMessagesByXMinutes = async (messages: Messages[], minutes: number): Promise<Messages[]> => {
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
          type: "unauthorized",
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
      const messagesByMinutes = await getMessagesByXMinutes(messages, minutesNumber);

      // if there are no messages then set Error
      if (messagesByMinutes.length === 0) {
        setError({
          type: "no-messages",
          title: "No Messages Found",
          description: "You have no 2FA messages in the last " + minutes + " minutes",
        });
        return;
      }
    }

    run();
  }, []);

  // set the icon
  const setIcon = (type: string) => {
    switch (type) {
      case "unauthorized":
        return Icon.Hammer;
      case "no-messages":
        return Icon.MagnifyingGlass;
    }
  };

  // if error is set show toast
  if (error) {
    return (
      <List navigationTitle={error.title}>
        {/*  set icon based on error type */}

        <List.EmptyView icon={setIcon(error.type)} title={error.title} description={error.description} />
      </List>
    );
  }

  return <Detail markdown="Example for proper error handling" />;
}
