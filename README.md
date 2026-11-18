# Patient Transport Request Coordinator

A browser-only demo for coordinating fictional, non-emergency patient transport requests. It uses plain HTML, CSS, JavaScript, and `localStorage`; it has no framework, database, or backend.

## Open and run in VS Code

1. Open VS Code.
2. Select **File > Open Folder...** and choose the folder containing `index.html`, `style.css`, and `app.js`.
3. If needed, install the **Live Server** extension from the Extensions view.
4. Open `index.html`, then click **Go Live** in the VS Code status bar (or right-click the file and choose **Open with Live Server**).
5. The app opens in your browser. Changes you make are saved in that browser's local storage.

## Try the features

- Review the sample schedule and dashboard counts. Sample references, locations, and staff names are fictional.
- Use **View as** to switch between the dispatcher and Amy Chen, Jordan Lee, or Sam Rivera. Drivers see only their own assigned trips and can update trip status.
- As dispatcher, choose a driver and vehicle on a request. Assigning a driver to a Requested trip automatically changes it to Confirmed.
- Search by patient reference or route location, or narrow the schedule using the status filter.
- Expand **Activity history** on a trip to see its recorded updates.
- Create a request using a non-sensitive patient reference and practical transport details only.

The app's data is stored locally in the current browser and is not shared with a service. Clearing this site's browser storage removes saved requests. This demo is for project demonstration, not emergency use.

## 3D overlay

Visual extras live in `3d-styles.css` and `3d-scene.js`. They sit on top of the original app and do not change request data, forms, or role logic in `app.js`.

The background is a hospital and ambulance scene: low-poly ambulances with red and blue roof beacons, floating care marks, a drifting heartbeat trace, and sparse bay lights. Three.js, GSAP, ScrollTrigger, and vanilla-tilt load from jsDelivr as classic scripts (not ES modules), so the page can still open over Live Server or as a local file if the CDN is reachable.

On viewports 700px and below, WebGL is skipped and a navy page wash with red and blue glows and rotating white, red, and blue orbs is used instead. If the OS asks for reduced motion, heavy animation and tilt are turned off. The canvas does not capture clicks; the existing UI stays fully usable.
