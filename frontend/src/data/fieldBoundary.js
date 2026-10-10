const fieldBoundary = {
  type: "FeatureCollection",

  features: [
    {
      type: "Feature",

      properties: {
        id: "GVF-001",
        name: "Green Valley Farm",
        crop: "Wheat",
        area: "12.6 ha",
      },

      geometry: {
        type: "Polygon",

        coordinates: [
          [
            [80.3278, 26.4527],
            [80.3312, 26.4541],
            [80.3353, 26.4524],
            [80.3370, 26.4491],
            [80.3342, 26.4468],
            [80.3301, 26.4472],
            [80.3272, 26.4496],
            [80.3278, 26.4527],
          ],
        ],
      },
    },
  ],
};

export default fieldBoundary;