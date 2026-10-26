import api from "./api";

export const getProducts = async (filters = {}) => {
  const response = await api.get("/products", {
    params: filters,
  });

  return response.data;
};