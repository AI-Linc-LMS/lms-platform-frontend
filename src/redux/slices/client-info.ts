// import {createSlice, PayloadAction} from "@reduxjs/toolkit";
//
// export interface ClientData {
//     "id": number,
//     "name": string,
//     "slug": string,
//     "logo_url": string,
//     "is_active": boolean
// }
//
// interface ClientInfoState {
//     data: ClientData;
// }
//
// const initialState = {} as ClientInfoState;
//
// const clientSlice = createSlice({
//     name: "clientInfo",
//     initialState,
//     reducers: {
//         setClientInfo: (state, action: PayloadAction<ClientData>) => {
//             state.data = action.payload;
//         },
//     }
// })
//
// export const {
//     setClientInfo
// } = clientSlice.actions
//
// export default clientSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ClientData {
  id: number;
  name: string;
  slug: string;
  app_logo_url: string;
  app_icon_url: string;
  login_img_url: string;
  show_footer: boolean;
  is_active: boolean;
  features: { id: number; name: string }[];
  theme_settings: ThemeDetails;
}

interface ThemeDetails {
  /* Primary Colors */
  primary50: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary800: string;
  primary900: string;

  /* Secondary Colors */
  secondary50: string;
  secondary100: string;
  secondary200: string;
  secondary300: string;
  secondary400: string;
  secondary500: string;
  secondary600: string;
  secondary700: string;

  /* Accent Colors */
  accentYellow: string;
  accentBlue: string;
  accentGreen: string;
  accentRed: string;
  accentOrange: string;
  accentTeal: string;
  accentPurple: string;
  accentPink: string;

  /* Neutral Colors */
  neutral50: string;
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;

  /* Success Colors */
  success50: string;
  success100: string;
  success500: string;

  /* Warning Colors */
  warning100: string;
  warning500: string;

  /* Error Colors */
  error100: string;
  error500: string;
  error600: string;

  /* Font Colors */
  fontPrimary: string;
  fontSecondary: string;
  fontTertiary: string;
  fontLight: string;
  navSelected: string;
  navBackground: string;
  fontDarkNav: string;
  fontLightNav: string;

  /* Dynamic Entry Points */
  primaryColor: string;
  primaryLightColor: string;
  secondaryColor: string;
  secondaryLightColor: string;

  /* Other */
  backgroundColor: string;
  fontFamily: string;
  fontFamilyPrimary: string;
  defaultPrimary: string;
  fontDark: string;
}

interface ClientInfoState {
  data?: ClientData;
}

const initialState: ClientInfoState = {
  data: {} as ClientData,
};

const clientSlice = createSlice({
  name: "clientInfo",
  initialState,
  reducers: {
    setClientInfo: (state, action: PayloadAction<ClientData>) => {
      console.log("clientInfo", action.payload);
      state.data = action.payload;
    },
  },
});

export const { setClientInfo } = clientSlice.actions;
export default clientSlice.reducer;
