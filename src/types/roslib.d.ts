declare module 'roslib' {
    export class ROS {
        constructor(options: { url: string });
        on(event: 'connection' | 'error' | 'close', callback: () => void): void;
        close(): void;
        isConnected: boolean;
    }

    export class Topic {
        constructor(options: {
            ros: ROS;
            name: string;
            messageType: string;
            queue_length?: number;
            throttle_rate?: number;
        });
        subscribe(callback: (message: any) => void): void;
        unsubscribe(): void;
    }
}
