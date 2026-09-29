/* POLAR CONNECT — parameter explainers.
   One entry per measured parameter: what it is, why it is measured, why it matters
   for India, and how it is typically measured. Used by Polar Live (live.html) and
   linked from the Support page.

   NOTE FOR EDITORS: this copy is written for a general audience. Have a domain
   scientist review the wording before publishing, and replace "typical methods"
   with the instruments actually used once real data sources are connected. */
(function (root) {
  "use strict";

  var DOMAINS = {
    ocean: {
      label: "Ocean",
      intro: "The ocean soaks up most of the extra heat and a large share of the CO₂ we emit, and its circulation ties the poles to the rest of the planet. These parameters cover its chemistry (pH, dissolved oxygen), its heat content (sea-water temperature), its melt-and-circulation signal (salinity), its biological engine (chlorophyll-a) and its effect on coastlines (sea level).",
      params: ["ph", "salinity", "seatemp", "do", "chla", "sealevel"]
    },
    ice: {
      label: "Ice & Glacier",
      intro: "Ice is where polar change is easiest to see and hardest to reverse. Extent tells us how much surface is covered, thickness tells us how much ice there really is, velocity tells us how fast it is being lost to the sea, surface temperature tells us when melting starts, and the melt rate and ice formation rate show whether the ice budget is gaining or losing.",
      params: ["icethick", "glaciervel", "surftemp", "seaiceext", "icemelt", "iceform"]
    },
    atmosphere: {
      label: "Atmosphere",
      intro: "Remote polar air is a clean-air laboratory: whatever is measured there has travelled a long way. Particles that absorb sunlight (black carbon), particles that reflect it (sulphate), the organic material that mixes with both, and the air temperature, ultraviolet (UV) radiation, pressure and wind that move and transform everything are read together to work out what is warming or cooling the poles.",
      params: ["airtemp", "uv", "pressure", "wind", "bc", "sulphate", "om"]
    },
    clouds: {
      label: "Clouds & Visibility",
      intro: "Clouds decide how much sunlight reaches the surface and how much heat escapes at night, and over bright snow and ice they usually warm rather than cool. Visibility tells field teams, pilots and ship crews what they can safely do. Cloud cover, base height and type, humidity and pressure are read together to describe the sky and to forecast what comes next.",
      params: ["cloudcover", "visibility", "cloudbase", "cloudtype", "humidity", "pressure"]
    },
    bio: {
      label: "Biodiversity",
      intro: "Living things respond to change faster than most instruments can. Plankton, krill, penguins, seals and microbes (and the nutrients that feed them) show whether the polar food web is stable, and they provide the baseline that conservation decisions depend on.",
      params: ["species", "ecoindex", "chla", "microbes", "nutrients"]
    }
  };

  var PARAMS = {
    ph: {
      name: "pH",
      unit: "unitless",
      what: "A scale for how acidic or alkaline seawater is. Lower pH means more acidic.",
      why: "The ocean absorbs a large share of the CO₂ released by human activity, and that CO₂ lowers seawater pH, a process called ocean acidification. Cold polar water dissolves more CO₂, so changes tend to show up there early. Shell-building plankton and other calcifying organisms are especially sensitive.",
      india: "A long polar baseline helps Indian ocean scientists judge how fast acidification is progressing and what it may mean for marine life, including in the Indian Ocean.",
      how: "Sensors on CTD profilers and moorings, checked against laboratory analysis of water samples."
    },
    salinity: {
      name: "Salinity",
      unit: "PSU",
      what: "How much dissolved salt seawater contains, in practical salinity units (PSU).",
      why: "Together with temperature, salinity sets the density of seawater, and density drives the deep ocean circulation. Meltwater from glaciers and sea ice freshens the surface, while freezing sea ice pushes salt out and makes nearby water saltier, so salinity works as a fingerprint of melting and freezing.",
      india: "Indian Southern Ocean expeditions sample the Indian Ocean sector, so salinity there connects polar processes to the ocean basin India depends on.",
      how: "Conductivity sensors on CTD profilers, floats and moorings; satellite salinity for large-scale patterns."
    },
    chla: {
      name: "Chlorophyll-a",
      unit: "mg/m³",
      what: "The main photosynthetic pigment in phytoplankton. Its concentration is a stand-in for how much phytoplankton is in the water.",
      why: "Phytoplankton are the base of the marine food web, feeding krill and, through them, fish, penguins, seals and whales, and they pull CO₂ out of the atmosphere. Chlorophyll-a shows how productive the ecosystem is and whether blooms are shifting in timing or place as sea ice retreats.",
      india: "Productivity of polar waters is a core theme of Indian Southern Ocean and Arctic studies, and a change in the food supply affects everything above it.",
      how: "Fluorometers on profilers and floats, laboratory pigment analysis of samples, and satellite ocean-colour imagery."
    },
    sealevel: {
      name: "Sea level",
      unit: "mm",
      what: "The height of the ocean surface relative to a fixed reference, usually reported as change in millimetres.",
      why: "Melting glaciers and ice sheets add water to the ocean, and a warming ocean also expands. Polar ice is the largest potential contributor to future sea-level rise, so ice loss and sea level are always read together.",
      india: "India has more than 7,500 km of coastline including its islands, along with major coastal cities and river deltas, so sea-level rise is a direct planning issue.",
      how: "Satellite radar altimetry and coastal tide gauges."
    },
    icethick: {
      name: "Ice thickness",
      unit: "m",
      what: "How thick sea ice or glacier ice is, in metres.",
      why: "Extent only shows how much surface is covered. Thickness gives volume, the actual amount of ice. Thinner ice melts out faster, reflects less sunlight and is less safe for wildlife, ships and field teams working on it.",
      india: "Ground-truth thickness from Indian stations and expeditions helps validate satellite ice products and supports safe field logistics.",
      how: "Ice-penetrating radar, drilling and ice-mass-balance buoys, upward-looking sonar, and satellite laser or radar altimetry."
    },
    glaciervel: {
      name: "Glacier velocity",
      unit: "m/yr",
      what: "How fast glacier ice flows downhill, in metres per year.",
      why: "A glacier that speeds up is usually delivering more ice to the ocean or losing the friction that held it back. Velocity combined with thickness lets scientists estimate how much ice is leaving a glacier and how much it will add to sea level.",
      india: "The same techniques are applied to Himalayan glaciers, which feed rivers that hundreds of millions of people rely on, so polar work builds both the methods and the comparison.",
      how: "GPS stakes on the ice, plus feature tracking and radar interferometry (InSAR) on satellite imagery."
    },
    surftemp: {
      name: "Surface temperature",
      unit: "°C",
      what: "The temperature of the snow or ice surface.",
      why: "Melt begins when the surface reaches 0 °C, so this is the trigger point for surface melting. The polar regions are warming faster than the global average, so surface temperature is an early indicator of climate change and a key input to models of the energy balance.",
      india: "Records from Indian stations such as Maitri, Bharati and Himadri add to the global picture of polar warming.",
      how: "Automatic weather stations and satellite thermal infrared."
    },
    seaiceext: {
      name: "Sea ice extent",
      unit: "km²",
      what: "The total ocean area with at least 15% ice cover.",
      why: "Bright ice reflects sunlight, so when it shrinks, dark open water absorbs more heat and warms further. This ice-albedo feedback makes extent the headline climate indicator, and it has one of the longest consistent satellite records.",
      india: "Researchers, including Indian groups, are studying whether Arctic sea-ice loss influences the Indian summer monsoon. This is an active research question, not a settled result.",
      how: "Passive-microwave satellite sensors, checked against ship and aerial observations."
    },
    bc: {
      name: "Black carbon",
      unit: "µg/m³",
      what: "Soot: fine particles from the incomplete burning of fuels and biomass that absorb sunlight.",
      why: "In the air, black carbon warms the atmosphere. When it settles on snow and ice it darkens the surface, so the ice absorbs more sunlight and melts faster. Measuring it in remote places shows how far pollution travels and how much it contributes to melting.",
      india: "Polar readings provide a clean-air baseline for comparison with measurements over the Himalaya and the Indian plains, where combustion emissions are far higher.",
      how: "Optical absorption instruments such as aethalometers, and analysis of snow and filter samples."
    },
    sulphate: {
      name: "Sulphate",
      unit: "µg/m³",
      what: "Aerosol formed from sulphur dioxide (from burning fossil fuels and from volcanoes) and from gases released by marine plankton.",
      why: "Unlike black carbon, sulphate mostly scatters sunlight and cools. To know whether particles warm or cool the poles overall, both are needed. Sulphate also traces long-range pollution transport and natural marine sources.",
      india: "Comparing polar baselines with Indian-region aerosol data helps separate natural background from human influence.",
      how: "Filter sampling followed by ion chromatography, and aerosol mass spectrometers."
    },
    om: {
      name: "Organic matter",
      unit: "µg/m³",
      what: "Carbon-containing particles from burning biomass and fuels, and from natural sources such as vegetation and ocean biology.",
      why: "Organic aerosol makes up a large part of particle mass. Its type decides whether it absorbs or scatters light and whether particles can seed clouds. Together with black carbon and sulphate it helps identify where the air came from.",
      india: "Biomass burning is a major source across South Asia, so organic aerosol signatures help trace it.",
      how: "Filter analysis and aerosol mass spectrometry."
    },
    wind: {
      name: "Wind speed",
      unit: "km/h",
      what: "How fast air moves near the surface.",
      why: "Wind drives sea-ice drift, mixes the upper ocean, moves snow and aerosols, and controls how quickly CO₂ passes between air and sea. It is also a safety parameter for station operations, flights and ship work.",
      india: "Work at Maitri, Bharati and Himadri is planned around weather, and wind is one of the deciding factors.",
      how: "Anemometers on automatic weather stations and towers."
    },
    cloudcover: {
      name: "Cloud cover", unit: "%",
      what: "The share of the sky hidden by cloud, often reported in oktas (eighths of the sky).",
      why: "Clouds reflect sunlight by day and trap heat at night. Over bright snow and ice, where the surface already reflects most sunlight, cloud usually adds warming, so cover strongly influences melt and surface temperature.",
      india: "Cloud records from Maitri, Bharati and Himadri help interpret satellite data and the energy balance of the ice, and support comparison with monsoon-region cloud behaviour.",
      how: "Ceilometers and all-sky cameras at stations, human observations in oktas, and satellite cloud products."
    },
    visibility: {
      name: "Visibility", unit: "km",
      what: "The greatest distance at which a dark object can be seen and recognised.",
      why: "Fog, blowing snow, precipitation and dense aerosol all cut visibility. It is a core safety parameter for flights, traverses, ship operations and work outside the station, and it also reflects how much particulate matter is in the air.",
      india: "Expedition logistics, helicopter movements and ship-to-shore transfers at Indian stations are planned around visibility limits.",
      how: "Forward-scatter visibility sensors on automatic weather stations, supported by observer reports."
    },
    cloudbase: {
      name: "Cloud base height", unit: "m",
      what: "The height above the ground of the lowest layer of cloud.",
      why: "A low cloud base means fog or low stratus, poor light and restricted flying. Base height also reveals how moist the lower atmosphere is and how it is layered.",
      india: "Low cloud over the ice shelf and coast determines whether aircraft and helicopters can operate near Indian stations.",
      how: "Laser ceilometers, with radiosonde profiles for comparison."
    },
    cloudtype: {
      name: "Cloud type", unit: "class",
      what: "The main cloud form present, such as stratus, cumulus, cirrus or altostratus.",
      why: "Each cloud type forms in a different way and affects radiation differently. Thin high cirrus and thick low stratus have very different effects on the surface, and changes of type often signal an approaching weather system.",
      india: "Consistent cloud classification lets Indian observations be compared with other polar stations and with satellite records.",
      how: "Trained observers using the WMO cloud classification, all-sky imagery and lidar or radar profiles."
    },
    humidity: {
      name: "Relative humidity", unit: "%",
      what: "How much water vapour the air holds compared with the most it could hold at that temperature.",
      why: "Near 100% humidity clouds and fog form and frost builds on instruments and surfaces. Humidity also controls how quickly snow and ice sublimate.",
      india: "Humidity contrasts between polar air and the Indian monsoon region help show how moisture travels around the globe.",
      how: "Capacitive humidity sensors in ventilated shields on weather stations and balloon soundings."
    },
    pressure: {
      name: "Air pressure", unit: "hPa",
      what: "The weight of the air above a point, in hectopascals.",
      why: "Falling pressure usually means an approaching storm, with cloud, wind and poor visibility, while rising pressure brings clearer weather. Antarctic storms and blizzards are tracked through pressure changes.",
      india: "Pressure trends give station teams early warning for blizzards and are used to plan field days and flights.",
      how: "Barometers on automatic weather stations and radiosondes."
    },
    seatemp: {
      name: "Sea-water temperature", unit: "°C",
      what: "The temperature of the ocean water, measured at the surface and at depth.",
      why: "The ocean stores over 90% of the excess heat trapped by greenhouse gases. Warm water melts floating ice shelves from below, sets how much CO₂ and oxygen water can hold, and controls where plankton, krill and fish can live. Polar water sits close to its freezing point (about −1.8 °C), so even small warming matters.",
      india: "Indian Southern Ocean cruises measure temperature along sections that connect polar waters to the Indian Ocean, helping link polar change to the monsoon-driving ocean India depends on.",
      how: "CTD profilers lowered from ships, Argo floats, moorings and satellite sea-surface temperature."
    },
    do: {
      name: "Dissolved oxygen", unit: "mg/L",
      what: "The amount of oxygen gas dissolved in seawater.",
      why: "Cold polar water holds a lot of oxygen, and sinking polar water carries it into the deep ocean. Falling dissolved oxygen can signal warming, stronger stratification or weaker circulation, and low oxygen stresses fish, krill and other marine life. It is also used to trace water masses.",
      india: "Deoxygenation is a concern in the Arabian Sea and Bay of Bengal, and polar oxygen records give a source-water baseline for understanding it.",
      how: "Optode or electrochemical sensors on CTD profilers and floats, calibrated by Winkler titration of water samples."
    },
    icemelt: {
      name: "Ice melt rate", unit: "cm/day",
      what: "How quickly ice loses thickness or mass to melting, often given as centimetres of ice per day (or metres of water equivalent per year).",
      why: "Melt rate is the direct measure of ice loss. It rises with air temperature, sunshine, rain, warm ocean water and soot on the surface. Meltwater raises sea level and freshens the ocean, so knowing how fast it happens is central to projections.",
      india: "Melt-rate methods used at Indian polar sites are shared with Himalayan glacier studies, where meltwater feeds rivers that millions depend on.",
      how: "Ablation stakes, automatic weather stations with sonic ranger height sensors, mass-balance buoys and satellite melt mapping."
    },
    iceform: {
      name: "Ice formation rate", unit: "cm/day",
      what: "How quickly new ice grows, such as sea ice freezing on open water or snow turning into glacier ice, in centimetres of growth per day.",
      why: "Melt alone does not decide whether ice survives; growth in the cold season has to replace it. Formation rate depends on air and water temperature, wind and salinity, and it releases salt into the water below, which helps drive deep ocean circulation.",
      india: "Freeze-up timing near Indian stations affects ship access and station logistics, and it feeds into the seasonal ice budget scientists compare year to year.",
      how: "Ice-mass-balance buoys, thermistor strings in the ice, upward-looking sonar and satellite ice-concentration and ice-age products."
    },
    airtemp: {
      name: "Air temperature", unit: "°C",
      what: "The temperature of the air near the surface, typically measured about 2 metres above the ground or ice.",
      why: "Air temperature decides whether snow falls or rain does, whether the surface melts, and how safe it is for people to work outdoors. The poles are warming faster than the global average, so long air-temperature records are among the clearest evidence of climate change.",
      india: "Temperature records from Maitri, Bharati and Himadri add to the global polar warming record and guide expedition safety.",
      how: "Shielded, ventilated thermometers on automatic weather stations and radiosonde balloons."
    },
    uv: {
      name: "UV index", unit: "index",
      what: "A scale for the strength of sunburn-causing ultraviolet radiation at the surface. Higher means stronger UV.",
      why: "Ozone high in the atmosphere blocks UV, and the Antarctic ozone hole lets more through each spring. Snow reflects up to 90% of UV, so exposure for people, plankton and surface organisms can be strong even when it is cold. UV records also track ozone recovery.",
      india: "Indian expedition members work under Antarctic UV conditions that need skin and eye protection, and Indian ozone and UV monitoring contributes to the global ozone record.",
      how: "UV radiometers and spectrophotometers on station roofs, ozone sondes and satellite ozone instruments."
    },
    nutrients: {
      name: "Nutrient concentration", unit: "µmol/L",
      what: "The amount of dissolved nutrients in seawater that plants and plankton need to grow, mainly nitrate, phosphate and silicate (and iron in tiny amounts).",
      why: "Nutrients set how much phytoplankton can grow. In much of the Southern Ocean nitrate and phosphate are plentiful but iron is short, so blooms depend on iron from melting ice and dust. Changes in nutrients therefore show how ice melt, mixing and circulation reshape the food web.",
      india: "Nutrient sampling on Indian Southern Ocean expeditions helps explain productivity patterns and how nutrient-rich polar water eventually feeds Indian Ocean fisheries.",
      how: "Water samples analysed by autoanalyser in the ship's lab, and in-situ nitrate sensors on floats and moorings."
    },
    species: {
      name: "Species observations",
      unit: "records",
      what: "Records of which species are seen where and when: penguins, seals, seabirds, krill, fish and more.",
      why: "Long-term counts reveal range shifts, population change and changes in breeding time as sea ice and climate change. They are the baseline that conservation decisions rely on, including those made under agreements such as CCAMLR.",
      india: "As a consultative party to the Antarctic Treaty, India contributes monitoring data to shared conservation efforts.",
      how: "Visual and photographic surveys, camera traps, acoustic surveys, tagging and environmental DNA."
    },
    ecoindex: {
      name: "Marine ecosystem",
      unit: "index",
      what: "A composite indicator that combines several measures, such as plankton, krill and predator condition, into one score.",
      why: "A single measurement can mislead. An index summarises whether the food web as a whole is stable or under stress, and it is easier to communicate to students, the public and policymakers.",
      india: "A simple headline indicator suits outreach and teaching, with the underlying parameters available for anyone who wants detail.",
      how: "Calculated from source datasets. The exact definition depends on the approved dataset it is calculated from."
    },
    microbes: {
      name: "Microbes",
      unit: "records",
      what: "Bacteria, archaea, fungi and other microorganisms living in seawater, ice, soil and lakes.",
      why: "Microbes drive the cycling of carbon and nutrients, and in thawing Arctic soils they influence how much CO₂ and methane is released. They respond quickly, so they are early indicators of change, and microbes adapted to extreme cold are studied for their unusual enzymes.",
      india: "Microbial studies of Antarctic lakes and soils and of Arctic fjords are an established theme of Indian polar research.",
      how: "Sample collection followed by culturing and DNA sequencing."
    }
  };

  root.POLAR_DOMAINS = DOMAINS;
  root.POLAR_PARAMS = PARAMS;
})(window);
