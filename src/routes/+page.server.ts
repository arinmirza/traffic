import { GOOGLE_API_KEY } from "$env/static/private";
import type { Actions } from "@sveltejs/kit";
import dayjs from 'dayjs'

export const actions =  {
    default: async ({ request, fetch }) => {
  
      const formData = await request.formData();
  
      const origins = formData.get("origins") as string ?? "" ;
      const destinations = formData.get("destinations") as string ?? "";

      console.log("origins=", origins);
      console.log("destinations=", destinations);
    
      const getTravelTimeMatrix = async (origins: string, destinations: string) => {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${GOOGLE_API_KEY}`;
        const response = (await fetch(url)).json();
        return response;
      }

      const getTimeDependentTravelTimeMatrix = async (origins: string, destinations: string) => {
        const start = dayjs().startOf("day").add(1, 'day').add(5, 'hours');

        let responses: any = [];

        for (let i = 0; i < 15; ++i) {
            const ts = start.add(i, "hours").toDate().getUTCSeconds();
            console.log(ts);
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&departure_time=${ts}&key=${GOOGLE_API_KEY}`;
            const response = (await fetch(url)).json();
            responses.push(response);
            return response;
        }

      }
  
    
      const response = await getTravelTimeMatrix(origins, destinations)
      console.log(response)
    
      return { response }
  
    }
    
  } satisfies Actions;