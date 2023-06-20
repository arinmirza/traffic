import { GOOGLE_API_KEY } from "$env/static/private";
import dayjs from "dayjs";
import type { RequestEvent } from "./$types";

export interface Distance { text: string, value: number }
export interface Duration { text: string, value: number }
export interface Element { distance: Distance, duration: Duration } 
export interface Row { elements: Element[] }
export interface DurationMatrixJSON { "destination_addresses": string[], "origin_addresses": string[], rows: Row[], status: string }

export async function GET({ url, fetch }: RequestEvent) {

    let origins: string = url.searchParams.get("origins") ?? "";
    let destinations: string = url.searchParams.get("destinations") ?? "";
    let departureTimes: string = url.searchParams.get("departureTimes") ?? "";
    let timeDependent: boolean = url.searchParams.get("timeDependent") === "true";


    let times = departureTimes.length > 0 ? departureTimes.split('|') : [];
    
    let query = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${GOOGLE_API_KEY}`;

    let results: {utc: string, matrix: DurationMatrixJSON}[] = [];
    
    if (times.length) {
        for (const time of times) {
            console.log(time);
            const response = await fetch(query + "&departure_time=" + time + "&traffic_model=pessimistic&region=de");
            results.push({utc: time, matrix: await response.json()});
        }
    } else {
        const response = await fetch(query);
        results.push({utc: "", matrix: await response.json()});
    }

    return new Response(JSON.stringify(results));
}

