export type Channel = SlackChannel | EmailChannel;

export type SlackChannel = {
    id: string;
    name: string;
    hook: string;
};

export type EmailChannel = {
    id: string;
    address: string;
    name: string;
};

export interface NotificationChannels {
    email: EmailChannel[];
    slack: SlackChannel[];
}
