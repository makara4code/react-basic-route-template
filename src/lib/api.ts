import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8787",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
