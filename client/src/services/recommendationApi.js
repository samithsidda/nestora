
import api from "./api";

export const getRecommendations = async (userRequest, filters = {}) => {
  const response = await api.post("/recommendations", {
    userRequest,
    filters,
  });

  return response.data;
};
