import type { RecipeGenre } from "./types";

export const DEMO_SAMPLE_PATH = "/demo/recipe-sample.svg";

export const DEMO_EXTRACTED_RECIPE = {
  title: "甘酢鶏",
  screenshotType: "site" as const,
  ingredients: [
    { name: "鶏もも肉", amount: "2枚" },
    { name: "酢", amount: "大さじ2" },
    { name: "しょうゆ", amount: "大さじ2" },
    { name: "砂糖", amount: "大さじ1" },
  ],
  genres: ["meat"] as RecipeGenre[],
};
