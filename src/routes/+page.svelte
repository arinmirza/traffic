<script lang="ts">
    import { Grid, Row, Column, Tile, TextInput, Button, DataTable, StructuredList, StructuredListBody, StructuredListRow, StructuredListCell, NumberInput, Dropdown, Loading, OverflowMenuItem, OverflowMenu } from "carbon-components-svelte";
	import { writable } from "svelte/store";
    import Cube from "carbon-icons-svelte/lib/Cube.svelte";
	import { onMount, setContext } from 'svelte';
	import { Hashtag, Home, Store, TrashCan } from "carbon-icons-svelte";
	import { buildDurationMatrix } from "./calc/matrix";
	import type { DurationMatrixJSON } from "./api/matrix/+server";
    import { BarChartSimple, LineChart } from "@carbon/charts-svelte";
	import dayjs from "dayjs";

    class Warehouse { name = ""; address = "" };
    class Customer { name = ""; address = "" };

    let preset = 0;


    let presets = [
        {
            warehouses: [
                {name: "WH", address: "Jedovnicestraße 10, 85609 Aschheim"},
            ],
            customers: [
                {name: "TUM", address: "Boltzmannstraße 3, 85748 Garching bei München"},
                {name: "LIDL 1", address: "Ludwig-Dill-Straße 69, 85221 Dachau"},
                {name: "LIDL 2", address: "Bergsonstraße 147, 81245 München"},
                {name: "Aral", address: "Grünwalder Str. 175C, 81545 München"},
            ],
        },
        { 
            warehouses: [
                { name: "WH1", address: "Heisenbergstraße 14, 85386 Eching" },
                { name: "WH2", address: "Marktpl. 1, 82031 Grünwald" },
                { name: "WH3", address: "Leibstraße 38, 85540 Haar" }
            ],
            customers: [
                { name: "ALDI 1", address: "Oskar-Maria-Graf-Ring 14, 81737 München"},
                { name: "ALDI 2", address: "Hermann-Weinhauser-Straße 90, 81673 München"},
                { name: "ALDI 3", address: "Hochstiftsweg 4, 81927 München"},
                { name: "REWE 1", address: "Arnulfstraße 32, 80335 München"},
                { name: "REWE 2", address: "ArnulfLindwurmstraße 129, 80337 München"},
                { name: "REWE 3", address: "Petra-Kelly-Straße 1, 80797 München"},
                { name: "PENNY", address: "Quiddestraße 58, 81735 München" }
            ]
        },
        {
            warehouses: [
                { name: "WH", address: "Münchner Str. 124, 85757 Karlsfeld"}
            ],
            customers: [
                { name: "MediaMarkt", address: "Einsteinstraße 130, 81675 München" },
                { name: "Aral", address: "Plinganserstraße 70, 81369 München" },
                { name: "LMU Klinikum", address: "Ziemssenstraße 5, 80336 München" },
                { name: "LIDL", address: "Schleißheimer Str. 85-87, 80797 München" },
                { name: "McDonalds", address: "Wasserburger Landstraße 52, 81825 München" },
            ]
        }
    ];

    let warehouses: Warehouse[] = presets[preset].warehouses;
    let customers: Customer[] = presets[preset].customers;

    let numberOfWarehouses = warehouses.length;
    let numberOfCustomers = customers.length;

    $: numberOfWarehouses, updateWarehouses();
    $: numberOfCustomers, updateCustomers();

    const updateWarehouses = () => { warehouses = Array.from({length: numberOfWarehouses}, (_, i) => warehouses[i] ?? new Warehouse()); }
    const updateCustomers = () => { customers = Array.from({length: numberOfCustomers}, (_, i) => customers[i] ?? new Customer()); }

    $: locations = warehouses.concat(customers);
    //$: origins = warehouses.map(w => w.address).join("|");
    //$: destinations = customers.map(c => c.address).join("|");

    
    let maxMatrix: number[][];
    let minMatrix: number[][];
    $: maxMatrix = Array.from({ length: locations.length}, () => []);
    $: minMatrix = Array.from({ length: locations.length}, () => []);
    
    
    const fillMatrix = () => {
        displayResults = false;
        let a = Array(locations);

        for (let i = 0; i < locations.length; ++i) {
            for (let j = 0; j < locations.length; ++j) {
                minMatrix[i][j] = 9999;
                maxMatrix[i][j] = 0;
            }
        }
    }

    $: locations, fillMatrix();

    const usePreset = (i: number) => {
        warehouses = presets[i].warehouses;
        customers = presets[i].customers;
        numberOfWarehouses = warehouses.length;
        numberOfCustomers = customers.length;
    }



    let begin = dayjs().startOf("day").add(1, "day");
    let times = Array(48).fill(null).map((_, i) => begin.add(i * 30, 'minutes'));


    
    let data: any[] = [];

    const calculate = async () => {
        loading = true;
        let timesUTC = times.map(t => t.toDate().getTime() / 1000).join('|');
        let origins = locations.map(x => x.address).join('|');
        let destinations = origins;
        let response = await fetch(`/api/matrix?origins=${origins}&destinations=${destinations}&departureTimes=${timesUTC}`);
        let json: {utc: string, matrix: DurationMatrixJSON}[] = await response.json();
        console.log("json=", json);


        json.forEach(e => {
            const utc = e.utc;
            const matrix = buildDurationMatrix(e.matrix);

            if (e.matrix.status !== "OK") {
                console.error("Status not OK", e);
                return;
            }

            for (const [i, row] of matrix.entries()) {
                for (const [j, value] of row.entries()) {
                    if (i == j) continue;
                   data.push({
                        from: i,
                        to: j,
                        group: locations[i].name + " → " + locations[j].name,
                        date: new Date(Number(utc) * 1000).toISOString(),
                        value: value / 60,
                    });

                    minMatrix[i][j] = Math.min(minMatrix[i][j], Math.ceil(value / 60));
                    maxMatrix[i][j] = Math.max(maxMatrix[i][j], Math.ceil(value / 60));

                }
            }

            data = data;
            

        });

        console.log(data);
        loading = false;
        displayResults = true;

        
    }


    let from: number = -1;
    let to: number = -1;

    const getNext = () => {
        to = -1;
        from = (from + 1) % locations.length;
    }
    
    $: from, to, filterData(data);
    let filteredData = [...data];
    

    const filterData = (data: any[]) => {
        let filtered = [...data];
        if (from !== -1) filtered = filtered.filter(x => x.from == from);
        if (to !== -1) filtered = filtered.filter(x => x.to === to);
        filteredData = filtered;
    }


    let displayResults: boolean = false;
    let loading: boolean = false;



    

</script>

{#if loading}
    <Loading />
{/if}
<Grid>
    <Row style="margin-bottom: 1rem;">
        <Column>
            <div style="display: flex; align-items: center;">
                <div>
                    <h1>Travel Time Calculation</h1>
                </div>
                
                <div style="margin-left: auto">
                    <Button on:click={calculate}>Build Duration Matrix</Button>
                </div>
            </div>
        </Column>
    </Row>


    <Row style="margin-bottom: 1rem;">
        <Column>
            <Tile>

                <div style="display: flex; align-items: center;">
                    <div><h2>Warehouses</h2></div>
                    <div style="margin-left: auto">
                        <OverflowMenu light>
                            <OverflowMenuItem text="Use Preset 1" on:click={() => {usePreset(0)}}/>
                            <OverflowMenuItem text="Use Preset 2" on:click={() => {usePreset(1)}}/>
                            <OverflowMenuItem text="Use Preset 3" on:click={() => {usePreset(2)}}/>
                          </OverflowMenu>
                    </div>
                </div>

                <br>

                <div style="display: flex; align-items: center;">
                    <div style="margin-right: 1rem;">
                        <span style="color: #525252;"><Hashtag/></span>
                    </div>
                    <div style="width: 100%">
                        <NumberInput light bind:value={numberOfWarehouses}/>
                    </div>
                </div>
                <br>
                
                
                {#each warehouses as warehouse, index}
                    <div style="display: flex; align-items: center;">
                        <div style="margin-right: 1rem;">
                            <span style="color: #525252;"><Home/></span>
                        </div>
                        <div style="margin-right: 1rem; width: 5%">
                            <center><strong>{index + 1}</strong></center>
                        </div>
                        <div style="margin-right: 1rem; width: 35%">
                            <TextInput light placeholder="Name" bind:value={warehouse.name} ></TextInput>
                        </div>
                        <div style="width: 100%">
                            <TextInput light placeholder="Address" bind:value={warehouse.address}></TextInput>
                        </div>
                    </div>
                    <br>
                {/each}

            </Tile>


        </Column>

        <Column>
            <Tile>
                <div><h2>Customers</h2></div><br>

                <div style="display: flex; align-items: center;">
                    <div style="margin-right: 1rem;">
                        <span style="color: #525252;"><Hashtag/></span>
                    </div>
                    <div style="width: 100%">
                        <NumberInput light bind:value={numberOfCustomers}/>
                    </div>
                </div>
                <br>
                
                
                {#each customers as customer, index}
                    <div style="display: flex; align-items: center;">
                        <div style="margin-right: 1rem;">
                            <span style="color: #525252"><strong><Store/></strong></span>
                        </div>
                        <div style="margin-right: 1rem; width: 5%">
                            <center><strong>{index + 1}</strong></center>
                        </div>
                        <div style="margin-right: 1rem; width: 35%;">
                            <TextInput light placeholder="Name" bind:value={customer.name}></TextInput>
                        </div>
                        <div style="width: 100%">
                            <TextInput light placeholder="Address" bind:value={customer.address}></TextInput>
                        </div>
                    </div>
                {/each}
            </Tile>
        </Column>
        
    </Row>

    {#if displayResults}
    <Row>
        <Column>

            <Tile>
            <h3>Travel Time Matrix</h3><br>
            <StructuredList style="background-color: white">
                <StructuredListBody>
                    <StructuredListRow>
                        <StructuredListCell></StructuredListCell>
                        {#each locations as destination, j}
                            <StructuredListCell head>
                                {destination.name}
                            </StructuredListCell>
                        {/each}
                    </StructuredListRow>
                    {#each locations as origin, i}
                        <StructuredListRow>
                            <StructuredListCell head>{origin.name}</StructuredListCell>
                            {#each locations as destination, j}
                            <StructuredListCell>
                                {#if i !== j}
                                    Min: {minMatrix[i][j]}<br>
                                    Max: {maxMatrix[i][j]}
                                {/if}
                            </StructuredListCell>
                            {/each}
                        </StructuredListRow>
                    {/each}
                </StructuredListBody>
            </StructuredList>
        </Tile>

        </Column>
    </Row>

    <br><br>

    <Row>
        <Column>
            <Tile>
                <h2>Timeseries</h2><br>
                <div style="display: flex; align-items:center">
                    <div style="width: 5%; margin-right: 1rem;"><h5>From</h5></div>
                    <div style="width: 40%; margin-right: 1rem;"><Dropdown light bind:selectedId={from} items={[{id: -1, text: "Anywhere"}].concat(locations.map((loc, idx) => ({ id: idx, text: loc.name})))}></Dropdown></div>
                    <div style="width: 5%; margin-right: 1rem;"><h5>To</h5></div>
                    <div style="width: 40%; margin-right: 1rem;"><Dropdown light bind:selectedId={to} items={[{id: -1, text: "Anywhere"}].concat(locations.map((loc, idx) => ({ id: idx, text: loc.name})))}></Dropdown></div>
                    <div style="width: 10%;"><Button kind="secondary" on:click={getNext} style="width: 100%">Next</Button></div>
                </div>

                <br><br>
                
                <LineChart
                    bind:data={filteredData}
                    options={{
                        "title": "Travel Times During the Day",
                        "axes": {
                            "bottom": {
                                "title": "Hours",
                                "mapsTo": "date",
                                scaleType: "time"
                            },
                            "left": {
                                "mapsTo": "value",
                                "title": "Travel Time (minutes)",
                                "scaleType": "linear"
                            }
                        },
                        "curve": "curveMonotoneX",
                        "height": "600px",
                        points: { radius: 1, enabled: false},
                    }}
                />
            </Tile>

        </Column>
    </Row>

    {/if}

</Grid>


