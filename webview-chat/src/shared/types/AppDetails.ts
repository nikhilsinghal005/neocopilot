export type chatModelDetail = {
  modelKey : string;
  modelName : string;
  modelDescription : string;
  modelType : string;
  modelUsageCountLeft: number;
  modelVersion?: string;
  modelUsageCountTotal?: number;
  modelBasedOn?: string;
  isBaseModel?: boolean;
};