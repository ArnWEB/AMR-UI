export const ROS_CONFIG = {
  websocketUrl: 'ws://localhost:9090',
  topics: {
    amr1: {
      left: '/amr1/front_stereo_camera/left/image_raw',
      right: '/amr1/front_stereo_camera/right/image_raw',
    },
    amr2: {
      left: '/amr2/front_stereo_camera/left/image_raw',
      right: '/amr2/front_stereo_camera/right/image_raw',
    },
    amr3: {
      left: '/amr3/front_stereo_camera/left/image_raw',
      right: '/amr3/front_stereo_camera/right/image_raw',
    },
  },
  // Fixed warehouse camera views for simulation mode
  warehouseCameras: [
    { id: 'cam1', name: 'Tor Right', topic: '/top_right/rgb' },
    {
      id: 'cam2', name: 'docking top', topic: '/docking_top/rgb'
    },
    { id: 'cam4', name: 'AMR1 DEPTH', topic: '/amr1_tpv/rgb' },
    { id: 'cam3', name: 'AMR1 RGB', topic: '/conveyor/rgb' },

    // { id: 'cam5', name: 'AMR2 RGB', topic: '/conveyor/rgb' },
  ],
  reconnectInterval: 3000,
  connectionTimeout: 5000,
};

export type AMRId = 'amr1' | 'amr2' | 'amr3';
export type CameraAngle = 'left' | 'right';

export interface ROSImageData {
  amrId: AMRId;
  angle: CameraAngle;
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
