import { createContext, useContext } from "react";

/** True when rendering inside a small preview thumbnail — carousels stay paused. */
export const ThumbnailContext = createContext(false);
export const useIsThumbnail = () => useContext(ThumbnailContext);
