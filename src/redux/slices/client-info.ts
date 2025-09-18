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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ClientData {
    "id": number,
    "name": string,
    "slug": string,
    "app_logo_url": string,
    "app_icon_url": string,
    "is_active": boolean,
    "features": {id: number, name: string}[]
}


interface ClientInfoState {
    data?: ClientData;
}

const initialState: ClientInfoState = {
    data: {} as ClientData,
};

const clientSlice = createSlice({
    name: 'clientInfo',
    initialState,
    reducers: {
        setClientInfo: (state, action: PayloadAction<ClientData>) => {
            console.log('clientInfo', action.payload);
            state.data = action.payload;
        }
    },
});

export const { setClientInfo } = clientSlice.actions;
export default clientSlice.reducer;