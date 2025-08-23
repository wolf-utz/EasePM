import {app} from "electron";

export interface AppConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  database: {
    synchronize: boolean;
    logging: boolean;
  };
}

function getNodeEnv(): 'development' | 'production' | 'test' {
  const env = process.env.NODE_ENV?.toLowerCase();

  if (env === 'production' || env === 'prod') return 'production';
  if (env === 'test') return 'test';

  return 'development';
}

function isDevelopmentMode(): boolean {
  return !app.isPackaged || getNodeEnv() === 'development';
}

export const config: AppConfig = {
  NODE_ENV: getNodeEnv(),
  isDevelopment: isDevelopmentMode(),
  isProduction: !isDevelopmentMode() && getNodeEnv() === 'production',
  isTest: getNodeEnv() === 'test',
  database: {
    synchronize: isDevelopmentMode(),
    logging: isDevelopmentMode()
  }
};

export default config;
