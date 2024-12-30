import { app, ipcMain } from "electron";
import path from "path";
import fs from "fs";

interface StoreOptions {
  configName: string;
  defaults: Record<string, any>;
}

class Store {
  path: string;
  data: Record<string, any>;

  constructor(opts: StoreOptions) {
    const userDataPath = app.getPath("userData");
    this.path = path.join(
      userDataPath,
      "ease-pm-data",
      opts.configName + ".json"
    );
    this._init(opts.defaults);

    // @todo remove this
    console.log("=== store path:", this.path);

    this.data = parseDataFile(this.path, opts.defaults);
  }

  _init(defaults: Record<string, any>) {
    const dir = path.dirname(this.path);

    // Check if directory exists, if not create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if file exists, if not create it with default data
    if (!fs.existsSync(this.path)) {
      fs.writeFileSync(this.path, JSON.stringify(defaults));
    }
  }

  get(key: string): any {
    return this.data[key];
  }

  getSingle(key: string, id: string): any {
    const index = this.data[key].findIndex((item: any) => item._id === id);
    if (index !== -1) {
      return this.data[key][index];
    } else {
      console.error(`Item with id ${id} not found in ${key}`);
      return null;
    }
  }

  set(key: string, val: any): void {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  add(key: string, val: any) {
    console.log("add data", this.data, key, val);

    this.data[key].push(val);
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  update(key: string, id: string, val: any) {
    const index = this.data[key].findIndex((item: any) => item._id === id);
    if (index !== -1) {
      this.data[key][index] = val;
      fs.writeFileSync(this.path, JSON.stringify(this.data));
    } else {
      console.error(`Item with id ${id} not found in ${key}`);
    }
  }

  removeSingle(key: string, id: string) {
    const index = this.data[key].findIndex((item: any) => item._id === id);
    if (index !== -1) {
      this.data[key].splice(index, 1);
      fs.writeFileSync(this.path, JSON.stringify(this.data));
    } else {
      console.error(`Item with id ${id} not found in ${key}`);
    }
  }
}

function parseDataFile(
  filePath: string,
  defaults: Record<string, any>
): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    return defaults;
  }
}

export default Store;
