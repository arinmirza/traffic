

<script lang="ts">
    import "carbon-components-svelte/css/g10.css";
    //import "@carbon/styles/css/styles.css";
    import "@carbon/charts/styles.css";
    import {
      Header,
      HeaderNav,
      HeaderNavItem,
      HeaderNavMenu,
      SkipToContent,
      Content,
      Grid,
      Row,
      Column,
    } from "carbon-components-svelte";
  
    let isSideNavOpen = false;

</script>
  
<Header company="" platformName="Route Optimization @ SAP" bind:isSideNavOpen>
    <svelte:fragment slot="skip-to-content">
      <SkipToContent />
    </svelte:fragment>
  
</Header>
  

<Content>
    <slot></slot>
</Content>

