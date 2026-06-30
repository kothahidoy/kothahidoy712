/**
 * LiveMap — cross-platform OpenStreetMap + Leaflet view.
 * ──────────────────────────────────────────────────────────────────────
 * Works on web (iframe with srcDoc) and native (react-native-webview).
 * Free — no API key, no Google Maps SDK.
 *
 *  Props:
 *    provider    { lat, lng } | null   — provider's current GPS
 *    destination { lat, lng } | null   — customer's address
 *    height      number               — map height in px (default 220)
 *
 *  The map auto-fits both pins, draws a dashed line between them, and
 *  smoothly animates the provider pin when its coords change.
 */
import React, { useMemo, useRef, useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export interface LatLng {
  lat: number;
  lng: number;
}

interface LiveMapProps {
  provider?: LatLng | null;
  destination?: LatLng | null;
  height?: number;
  testID?: string;
}

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#E5E7EB; }
  .pulse {
    width:14px; height:14px; border-radius:50%;
    background:#2563EB; border:3px solid #FFFFFF;
    box-shadow:0 2px 10px rgba(37,99,235,0.6);
    position:relative;
  }
  .pulse::after {
    content:""; position:absolute; top:-3px; left:-3px;
    width:14px; height:14px; border-radius:50%;
    background:rgba(37,99,235,0.4);
    animation:pulse 1.6s ease-out infinite;
  }
  @keyframes pulse {
    0%   { transform:scale(1);    opacity:1; }
    100% { transform:scale(3.2);  opacity:0; }
  }
  .dest {
    width:22px; height:22px;
    border-radius:50% 50% 50% 0;
    background:#DC2626;
    border:2px solid #FFFFFF;
    transform:rotate(-45deg);
    box-shadow:0 2px 6px rgba(0,0,0,0.25);
  }
  .leaflet-control-attribution { font-size:9px !important; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function(){
  var map = L.map('map', { zoomControl:false, attributionControl:true }).setView([23.5204, 87.3119], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19, attribution:'© OSM'
  }).addTo(map);

  var providerMarker = null, destMarker = null, line = null;

  function setProvider(p){
    if (!p) return;
    if (!providerMarker){
      providerMarker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className:'', html:'<div class="pulse"></div>', iconSize:[14,14], iconAnchor:[7,7] })
      }).addTo(map);
    } else {
      providerMarker.setLatLng([p.lat, p.lng]);
    }
  }
  function setDest(d){
    if (!d) return;
    if (!destMarker){
      destMarker = L.marker([d.lat, d.lng], {
        icon: L.divIcon({ className:'', html:'<div class="dest"></div>', iconSize:[22,22], iconAnchor:[11,22] })
      }).addTo(map);
    } else {
      destMarker.setLatLng([d.lat, d.lng]);
    }
  }
  function refit(){
    if (providerMarker && destMarker){
      var b = L.latLngBounds([providerMarker.getLatLng(), destMarker.getLatLng()]);
      map.fitBounds(b, { padding:[34,34], maxZoom:15 });
      if (line) line.remove();
      line = L.polyline(
        [providerMarker.getLatLng(), destMarker.getLatLng()],
        { color:'#2563EB', weight:3, opacity:0.55, dashArray:'8,8' }
      ).addTo(map);
    } else if (providerMarker){
      map.setView(providerMarker.getLatLng(), 14, { animate:true });
    } else if (destMarker){
      map.setView(destMarker.getLatLng(), 14, { animate:true });
    }
  }
  function apply(payload){
    try {
      if (payload.provider)    setProvider(payload.provider);
      if (payload.destination) setDest(payload.destination);
      refit();
    } catch(e){}
  }

  // Bridge inbound messages from both RN-WebView and web iframe parent.
  window.addEventListener('message', function(e){
    try { var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; apply(d); } catch(e){}
  });
  document.addEventListener('message', function(e){
    try { var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; apply(d); } catch(e){}
  });

  // Tell host we're ready so host can flush queued messages.
  function ready(){
    try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage('READY'); } catch(e){}
    try { window.parent && window.parent.postMessage('READY', '*'); } catch(e){}
  }
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready);
})();
</script>
</body>
</html>
`.trim();

export const LiveMap: React.FC<LiveMapProps> = ({
  provider,
  destination,
  height = 220,
  testID,
}) => {
  const webRef = useRef<WebView | null>(null);
  const iframeRef = useRef<any>(null);
  const readyRef = useRef(false);
  const lastPayloadRef = useRef<string>("");

  const payload = useMemo(() => {
    const p: any = {};
    if (provider && Number.isFinite(provider.lat) && Number.isFinite(provider.lng)) {
      p.provider = { lat: provider.lat, lng: provider.lng };
    }
    if (destination && Number.isFinite(destination.lat) && Number.isFinite(destination.lng)) {
      p.destination = { lat: destination.lat, lng: destination.lng };
    }
    return JSON.stringify(p);
  }, [provider, destination]);

  // Push payload to map once it's ready (and on every change after).
  useEffect(() => {
    if (!payload || payload === "{}") return;
    lastPayloadRef.current = payload;
    if (!readyRef.current) return;
    if (Platform.OS === "web") {
      try {
        const iframe: HTMLIFrameElement | null = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(payload, "*");
        }
      } catch {}
    } else {
      try {
        webRef.current?.injectJavaScript(
          `(function(){try{window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} }));}catch(e){}})(); true;`,
        );
      } catch {}
    }
  }, [payload]);

  // Listen for READY signal from the iframe (web only).
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onMsg = (e: MessageEvent) => {
      if (e.data === "READY") {
        readyRef.current = true;
        if (lastPayloadRef.current && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(lastPayloadRef.current, "*");
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // ────────────────────────────────────────────────────────
  // WEB BRANCH — use a raw <iframe> with srcDoc.
  // ────────────────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={[styles.wrap, { height }]} testID={testID}>
        {React.createElement("iframe", {
          ref: iframeRef,
          srcDoc: LEAFLET_HTML,
          style: {
            border: 0,
            width: "100%",
            height: "100%",
            borderRadius: 14,
            display: "block",
          } as any,
        })}
      </View>
    );
  }

  // ────────────────────────────────────────────────────────
  // NATIVE BRANCH — react-native-webview.
  // ────────────────────────────────────────────────────────
  return (
    <View style={[styles.wrap, { height }]} testID={testID}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: LEAFLET_HTML }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        scalesPageToFit
        onMessage={(e) => {
          if (e.nativeEvent.data === "READY") {
            readyRef.current = true;
            if (lastPayloadRef.current) {
              try {
                webRef.current?.injectJavaScript(
                  `(function(){try{window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
                    lastPayloadRef.current,
                  )} }));}catch(e){}})(); true;`,
                );
              } catch {}
            }
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  webview: { flex: 1, backgroundColor: "transparent" },
});
