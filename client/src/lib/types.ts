export type ConnectionStatus = "connected" | "disconnected" | "pending" | "error";

export type ConnectionInfo = {
  label: string;
  status: ConnectionStatus;
};

