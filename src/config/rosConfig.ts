export const ROS_CONFIG = {
  websocketUrl: 'ws://localhost:9090',
  topics: {
    amr1: '/amr1/front_stereo_camera/left/image_raw',
    amr2: '/amr1/front_stereo_camera/right/image_raw',
    amr3: '/amr1/front_stereo_camera/left/image_raw',
  },
  reconnectInterval: 3000,
  connectionTimeout: 5000,
};

export type AMRId = 'amr1' | 'amr2' | 'amr3';

export interface ROSImageData {
  amrId: AMRId;
  imageBase64: string;
  mimeType?: string;
  timestamp: number;
  width: number;
  height: number;
}

export interface ROSConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}
