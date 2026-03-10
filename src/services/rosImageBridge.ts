/* eslint-disable @typescript-eslint/no-explicit-any */
import { ROS_CONFIG, AMRId, ROSImageData, ROSConnectionState } from '@/config/rosConfig';

declare global {
  interface Window {
    ROSLIB: any;
  }
}

let ros: any = null;
const imageSubscribers: Map<AMRId, any> = new Map();

const imageCallbacks: Map<AMRId, (data: ROSImageData) => void> = new Map();
const connectionCallbacks: Set<(state: ROSConnectionState) => void> = new Set();
const rosReadyCallbacks: Set<() => void> = new Set();

let connectionState: ROSConnectionState = {
  isConnected: false,
  isConnecting: false,
  error: null,
};

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isLoadingRoslib = false;
let loadPromise: Promise<void> | null = null;

function updateConnectionState(state: Partial<ROSConnectionState>) {
  connectionState = { ...connectionState, ...state };
  connectionCallbacks.forEach(cb => cb(connectionState));
}

async function loadRoslib(): Promise<void> {
  if (window.ROSLIB && window.ROSLIB.Ros) return;
  if (isLoadingRoslib && loadPromise) {
    await loadPromise;
    return;
  }

  isLoadingRoslib = true;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/roslib@1.4.0/build/roslib.min.js';
    script.onload = () => {
      console.log('roslib loaded:', typeof window.ROSLIB.Ros);
      isLoadingRoslib = false;
      resolve();
    };
    script.onerror = () => {
      isLoadingRoslib = false;
      reject(new Error('Failed to load roslib'));
    };
    document.head.appendChild(script);
  });

  await loadPromise;
}

export async function connectROS(): Promise<void> {
  if (ros?.isConnected) return;

  updateConnectionState({ isConnecting: true, error: null });

  try {
    await loadRoslib();
    
    if (!window.ROSLIB || !window.ROSLIB.Ros) {
      throw new Error('ROSLIB not loaded properly');
    }

    ros = new window.ROSLIB.Ros({
      url: ROS_CONFIG.websocketUrl,
    });

    ros.on('connection', () => {
      console.log('ROS connected via rosbridge');
      updateConnectionState({ isConnected: true, isConnecting: false, error: null });
      
      // Notify that ROS is ready
      rosReadyCallbacks.forEach(cb => cb());
      
      // Get list of available topics
      ros.getTopics((topics: any) => {
        console.log('Available topics:', topics);
      });
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    });

    ros.on('error', (error: any) => {
      console.error('ROS error:', error);
      updateConnectionState({ isConnected: false, isConnecting: false, error: String(error) });
    });

    ros.on('close', () => {
      console.log('ROS disconnected');
      updateConnectionState({ isConnected: false, isConnecting: false });
      scheduleReconnect();
    });

  } catch (error) {
    updateConnectionState({ isConnecting: false, error: String(error) });
    scheduleReconnect();
    throw error;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectROS().catch(console.error);
  }, ROS_CONFIG.reconnectInterval);
}

export function disconnectROS(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  imageSubscribers.forEach((sub) => sub.unsubscribe());
  imageSubscribers.clear();
  ros?.close();
  ros = null;
  updateConnectionState({ isConnected: false, isConnecting: false });
}

export function subscribeToImage(
  amrId: AMRId,
  callback: (data: ROSImageData) => void
): () => void {
  imageCallbacks.set(amrId, callback);

  const doSubscribe = () => {
    if (!ros || !ros.isConnected) {
      console.warn('ROS not connected, cannot subscribe to', amrId);
      return;
    }

    const topicName = ROS_CONFIG.topics[amrId];
  
    const existingSub = imageSubscribers.get(amrId);
    if (existingSub) {
      existingSub.unsubscribe();
    }

    if (!window.ROSLIB || !window.ROSLIB.Topic) {
      console.warn('roslib Topic not loaded');
      return;
    }

    const topic = new window.ROSLIB.Topic({
      ros: ros,
      name: topicName,
      messageType: 'sensor_msgs/Image',
      queue_length: 1,
      throttle_rate: 100,
    });

    console.log(`Subscribing to ${topicName}...`);
    
    topic.subscribe((message: any) => {
      try {
        let imageData: string;
        
        if (message.encoding === 'rgb8' || message.encoding === 'bgr8') {
          // Convert raw RGB to PNG using canvas
          imageData = convertRgbToPng(message.data, message.width, message.height);
        } else if (message.encoding === 'jpeg' || message.encoding === 'jpegCompressed') {
          imageData = message.data;
        } else {
          // Try as raw bytes
          imageData = uint8ArrayToBase64(message.data);
        }
        
        const data: ROSImageData = {
          amrId,
          imageBase64: imageData,
          timestamp: message.header?.stamp?.sec 
            ? message.header.stamp.sec * 1000 + (message.header.stamp.nsec || 0) / 1000000
            : Date.now(),
          width: message.width || 640,
          height: message.height || 480,
        };
        callback(data);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    });

    imageSubscribers.set(amrId, topic);
  };

  if (!ros || !ros.isConnected) {
    console.warn('ROS not connected, cannot subscribe to', amrId);
    // Try after a delay
    setTimeout(doSubscribe, 500);
    return () => imageCallbacks.delete(amrId);
  }

  doSubscribe();

  return () => {
    imageCallbacks.delete(amrId);
    const sub = imageSubscribers.get(amrId);
    if (sub) {
      sub.unsubscribe();
      imageSubscribers.delete(amrId);
    }
  };
}

export function unsubscribeFromImage(amrId: AMRId): void {
  const topic = imageSubscribers.get(amrId);
  if (topic) {
    topic.unsubscribe();
    imageSubscribers.delete(amrId);
  }
  imageCallbacks.delete(amrId);
}

function uint8ArrayToBase64(uint8Array: Uint8Array | number[]): string {
  let binary = '';
  const len = uint8Array.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

function convertRgbToPng(data: Uint8Array | number[] | string, width: number, height: number): string {
  try {
    let dataArray: number[];
    if (typeof data === 'string') {
      dataArray = [];
      for (let i = 0; i < data.length; i++) {
        dataArray.push(data.charCodeAt(i));
      }
    } else {
      dataArray = Array.from(data);
    }
    
    const expectedRgba = width * height * 4;
    const isRgba = dataArray.length === expectedRgba;
    
    // Full resolution for best quality
    const outWidth = width;
    const outHeight = height;
    
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const imgData = ctx.createImageData(outWidth, outHeight);
    const pixels = imgData.data;
    
    for (let y = 0; y < outHeight; y++) {
      for (let x = 0; x < outWidth; x++) {
        const dstIdx = (y * outWidth + x) * 4;
        
        if (isRgba) {
          // RGBA format - direct copy
          const srcIdx = (y * width + x) * 4;
          pixels[dstIdx] = dataArray[srcIdx] || 0;
          pixels[dstIdx + 1] = dataArray[srcIdx + 1] || 0;
          pixels[dstIdx + 2] = dataArray[srcIdx + 2] || 0;
          pixels[dstIdx + 3] = dataArray[srcIdx + 3] || 255;
        } else {
          // RGB format (3 bytes per pixel)
          const srcIdx = (y * width + x) * 3;
          // Brightness boost for dark images
          const r = Math.min(255, (dataArray[srcIdx] || 0) * 1.2);
          const g = Math.min(255, (dataArray[srcIdx + 1] || 0) * 1.2);
          const b = Math.min(255, (dataArray[srcIdx + 2] || 0) * 1.2);
          pixels[dstIdx] = r;
          pixels[dstIdx + 1] = g;
          pixels[dstIdx + 2] = b;
          pixels[dstIdx + 3] = 255;
        }
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  } catch (e) {
    console.error('Error converting RGB:', e);
    return uint8ArrayToBase64(typeof data === 'string' ? data.split('').map(c => c.charCodeAt(0)) : data);
  }
}

export function onConnectionChange(callback: (state: ROSConnectionState) => void): () => void {
  connectionCallbacks.add(callback);
  callback(connectionState);
  return () => connectionCallbacks.delete(callback);
}

export function getConnectionState(): ROSConnectionState {
  return connectionState;
}

export function getAvailableTopics(callback: (topics: string[]) => void): void {
  if (!ros?.isConnected) {
    callback([]);
    return;
  }
  ros.getTopics((topics: any) => {
    callback(topics?.topics || topics || []);
  });
}

export function onRosReady(callback: () => void): () => void {
  rosReadyCallbacks.add(callback);
  if (ros?.isConnected) {
    callback();
  }
  return () => rosReadyCallbacks.delete(callback);
}
