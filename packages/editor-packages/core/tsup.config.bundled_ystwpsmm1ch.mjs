// tsup.config.ts
import { defineConfig } from "tsup";

// ../tsup-config/index.ts
import fs from "fs";
import path from "path";
import postcss from "postcss";
import postcssModules from "postcss-modules";
var config = {
  dts: true,
  format: ["cjs", "esm"],
  inject: ["../tsup-config/react-import.js"],
  external: [
    "react",
    "react-dom",
    "@puckeditor/core",
    "@dnd-kit/react",
    "@dnd-kit/dom",
    "@dnd-kit/abstract",
    "@dnd-kit/state",
    "@dnd-kit/geometry",
    "@dnd-kit/utilities"
  ],
  esbuildPlugins: [
    {
      name: "css-module",
      setup(build) {
        build.onResolve(
          { filter: /\.module\.css$/, namespace: "file" },
          (args) => ({
            path: `${path.join(args.resolveDir, args.path)}#css-module`,
            namespace: "css-module",
            pluginData: {
              pathDir: path.join(args.resolveDir, args.path)
            }
          })
        );
        build.onLoad(
          { filter: /#css-module$/, namespace: "css-module" },
          async (args) => {
            const { pluginData } = args;
            const source = fs.readFileSync(pluginData.pathDir, "utf8");
            let cssModule = {};
            const result = await postcss([
              postcssModules({
                getJSON(_, json) {
                  cssModule = json;
                }
              })
            ]).process(source, { from: pluginData.pathDir });
            return {
              pluginData: { css: result.css },
              contents: `import "${pluginData.pathDir}"; export default ${JSON.stringify(cssModule)}`
            };
          }
        );
        build.onResolve(
          { filter: /\.module\.css$/, namespace: "css-module" },
          (args) => ({
            path: path.join(args.resolveDir, args.path, "#css-module-data"),
            namespace: "css-module",
            pluginData: args.pluginData
          })
        );
        build.onLoad(
          { filter: /#css-module-data$/, namespace: "css-module" },
          (args) => ({
            contents: args.pluginData.css,
            loader: "css"
          })
        );
      }
    }
  ]
};
var tsup_config_default = config;

// tsup.config.ts
var tsup_config_default2 = defineConfig({ ...tsup_config_default });
export {
  tsup_config_default2 as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiLCAiLi4vdHN1cC1jb25maWcvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUveWFzc2VyLWphbWFsLWFsLWRlZW4vZ3JhZHVhdGlvbi1wcm9qZWN0L3Byb2plY3QvU09PUS9wYWNrYWdlcy9lZGl0b3ItcGFja2FnZXMvY29yZS90c3VwLmNvbmZpZy50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvaG9tZS95YXNzZXItamFtYWwtYWwtZGVlbi9ncmFkdWF0aW9uLXByb2plY3QvcHJvamVjdC9TT09RL3BhY2thZ2VzL2VkaXRvci1wYWNrYWdlcy9jb3JlXCI7Y29uc3QgX19pbmplY3RlZF9pbXBvcnRfbWV0YV91cmxfXyA9IFwiZmlsZTovLy9ob21lL3lhc3Nlci1qYW1hbC1hbC1kZWVuL2dyYWR1YXRpb24tcHJvamVjdC9wcm9qZWN0L1NPT1EvcGFja2FnZXMvZWRpdG9yLXBhY2thZ2VzL2NvcmUvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidHN1cFwiO1xuaW1wb3J0IHRzdXBjb25maWcgZnJvbSBcIi4uL3RzdXAtY29uZmlnXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7IC4uLnRzdXBjb25maWcgfSk7XG4iLCAiY29uc3QgX19pbmplY3RlZF9maWxlbmFtZV9fID0gXCIvaG9tZS95YXNzZXItamFtYWwtYWwtZGVlbi9ncmFkdWF0aW9uLXByb2plY3QvcHJvamVjdC9TT09RL3BhY2thZ2VzL2VkaXRvci1wYWNrYWdlcy90c3VwLWNvbmZpZy9pbmRleC50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvaG9tZS95YXNzZXItamFtYWwtYWwtZGVlbi9ncmFkdWF0aW9uLXByb2plY3QvcHJvamVjdC9TT09RL3BhY2thZ2VzL2VkaXRvci1wYWNrYWdlcy90c3VwLWNvbmZpZ1wiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vaG9tZS95YXNzZXItamFtYWwtYWwtZGVlbi9ncmFkdWF0aW9uLXByb2plY3QvcHJvamVjdC9TT09RL3BhY2thZ2VzL2VkaXRvci1wYWNrYWdlcy90c3VwLWNvbmZpZy9pbmRleC50c1wiO2ltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgcG9zdGNzcyBmcm9tIFwicG9zdGNzc1wiO1xuaW1wb3J0IHBvc3Rjc3NNb2R1bGVzIGZyb20gXCJwb3N0Y3NzLW1vZHVsZXNcIjtcbmltcG9ydCB0eXBlIHsgT3B0aW9ucyB9IGZyb20gXCJ0c3VwXCI7XG5cbmNvbnN0IGNvbmZpZzogT3B0aW9ucyA9IHtcbiAgZHRzOiB0cnVlLFxuICBmb3JtYXQ6IFtcImNqc1wiLCBcImVzbVwiXSxcbiAgaW5qZWN0OiBbXCIuLi90c3VwLWNvbmZpZy9yZWFjdC1pbXBvcnQuanNcIl0sXG4gIGV4dGVybmFsOiBbXG4gICAgXCJyZWFjdFwiLFxuICAgIFwicmVhY3QtZG9tXCIsXG4gICAgXCJAcHVja2VkaXRvci9jb3JlXCIsXG4gICAgXCJAZG5kLWtpdC9yZWFjdFwiLFxuICAgIFwiQGRuZC1raXQvZG9tXCIsXG4gICAgXCJAZG5kLWtpdC9hYnN0cmFjdFwiLFxuICAgIFwiQGRuZC1raXQvc3RhdGVcIixcbiAgICBcIkBkbmQta2l0L2dlb21ldHJ5XCIsXG4gICAgXCJAZG5kLWtpdC91dGlsaXRpZXNcIixcbiAgXSxcbiAgZXNidWlsZFBsdWdpbnM6IFtcbiAgICB7XG4gICAgICBuYW1lOiBcImNzcy1tb2R1bGVcIixcbiAgICAgIHNldHVwKGJ1aWxkKTogdm9pZCB7XG4gICAgICAgIGJ1aWxkLm9uUmVzb2x2ZShcbiAgICAgICAgICB7IGZpbHRlcjogL1xcLm1vZHVsZVxcLmNzcyQvLCBuYW1lc3BhY2U6IFwiZmlsZVwiIH0sXG4gICAgICAgICAgKGFyZ3MpID0+ICh7XG4gICAgICAgICAgICBwYXRoOiBgJHtwYXRoLmpvaW4oYXJncy5yZXNvbHZlRGlyLCBhcmdzLnBhdGgpfSNjc3MtbW9kdWxlYCxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogXCJjc3MtbW9kdWxlXCIsXG4gICAgICAgICAgICBwbHVnaW5EYXRhOiB7XG4gICAgICAgICAgICAgIHBhdGhEaXI6IHBhdGguam9pbihhcmdzLnJlc29sdmVEaXIsIGFyZ3MucGF0aCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICAgIGJ1aWxkLm9uTG9hZChcbiAgICAgICAgICB7IGZpbHRlcjogLyNjc3MtbW9kdWxlJC8sIG5hbWVzcGFjZTogXCJjc3MtbW9kdWxlXCIgfSxcbiAgICAgICAgICBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBwbHVnaW5EYXRhIH0gPSBhcmdzIGFzIHtcbiAgICAgICAgICAgICAgcGx1Z2luRGF0YTogeyBwYXRoRGlyOiBzdHJpbmcgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IGZzLnJlYWRGaWxlU3luYyhwbHVnaW5EYXRhLnBhdGhEaXIsIFwidXRmOFwiKTtcblxuICAgICAgICAgICAgbGV0IGNzc01vZHVsZSA9IHt9O1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcG9zdGNzcyhbXG4gICAgICAgICAgICAgIHBvc3Rjc3NNb2R1bGVzKHtcbiAgICAgICAgICAgICAgICBnZXRKU09OKF8sIGpzb24pIHtcbiAgICAgICAgICAgICAgICAgIGNzc01vZHVsZSA9IGpzb247XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdKS5wcm9jZXNzKHNvdXJjZSwgeyBmcm9tOiBwbHVnaW5EYXRhLnBhdGhEaXIgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHBsdWdpbkRhdGE6IHsgY3NzOiByZXN1bHQuY3NzIH0sXG4gICAgICAgICAgICAgIGNvbnRlbnRzOiBgaW1wb3J0IFwiJHtcbiAgICAgICAgICAgICAgICBwbHVnaW5EYXRhLnBhdGhEaXJcbiAgICAgICAgICAgICAgfVwiOyBleHBvcnQgZGVmYXVsdCAke0pTT04uc3RyaW5naWZ5KGNzc01vZHVsZSl9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBidWlsZC5vblJlc29sdmUoXG4gICAgICAgICAgeyBmaWx0ZXI6IC9cXC5tb2R1bGVcXC5jc3MkLywgbmFtZXNwYWNlOiBcImNzcy1tb2R1bGVcIiB9LFxuICAgICAgICAgIChhcmdzKSA9PiAoe1xuICAgICAgICAgICAgcGF0aDogcGF0aC5qb2luKGFyZ3MucmVzb2x2ZURpciwgYXJncy5wYXRoLCBcIiNjc3MtbW9kdWxlLWRhdGFcIiksXG4gICAgICAgICAgICBuYW1lc3BhY2U6IFwiY3NzLW1vZHVsZVwiLFxuICAgICAgICAgICAgcGx1Z2luRGF0YTogYXJncy5wbHVnaW5EYXRhIGFzIHsgY3NzOiBzdHJpbmcgfSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgICBidWlsZC5vbkxvYWQoXG4gICAgICAgICAgeyBmaWx0ZXI6IC8jY3NzLW1vZHVsZS1kYXRhJC8sIG5hbWVzcGFjZTogXCJjc3MtbW9kdWxlXCIgfSxcbiAgICAgICAgICAoYXJncykgPT4gKHtcbiAgICAgICAgICAgIGNvbnRlbnRzOiAoYXJncy5wbHVnaW5EYXRhIGFzIHsgY3NzOiBzdHJpbmcgfSkuY3NzLFxuICAgICAgICAgICAgbG9hZGVyOiBcImNzc1wiLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNaLFNBQVMsb0JBQW9COzs7QUNBcEIsT0FBTyxRQUFRO0FBQzlhLE9BQU8sVUFBVTtBQUNqQixPQUFPLGFBQWE7QUFDcEIsT0FBTyxvQkFBb0I7QUFHM0IsSUFBTSxTQUFrQjtBQUFBLEVBQ3RCLEtBQUs7QUFBQSxFQUNMLFFBQVEsQ0FBQyxPQUFPLEtBQUs7QUFBQSxFQUNyQixRQUFRLENBQUMsZ0NBQWdDO0FBQUEsRUFDekMsVUFBVTtBQUFBLElBQ1I7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGdCQUFnQjtBQUFBLElBQ2Q7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLE1BQU0sT0FBYTtBQUNqQixjQUFNO0FBQUEsVUFDSixFQUFFLFFBQVEsa0JBQWtCLFdBQVcsT0FBTztBQUFBLFVBQzlDLENBQUMsVUFBVTtBQUFBLFlBQ1QsTUFBTSxHQUFHLEtBQUssS0FBSyxLQUFLLFlBQVksS0FBSyxJQUFJLENBQUM7QUFBQSxZQUM5QyxXQUFXO0FBQUEsWUFDWCxZQUFZO0FBQUEsY0FDVixTQUFTLEtBQUssS0FBSyxLQUFLLFlBQVksS0FBSyxJQUFJO0FBQUEsWUFDL0M7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUNBLGNBQU07QUFBQSxVQUNKLEVBQUUsUUFBUSxnQkFBZ0IsV0FBVyxhQUFhO0FBQUEsVUFDbEQsT0FBTyxTQUFTO0FBQ2Qsa0JBQU0sRUFBRSxXQUFXLElBQUk7QUFJdkIsa0JBQU0sU0FBUyxHQUFHLGFBQWEsV0FBVyxTQUFTLE1BQU07QUFFekQsZ0JBQUksWUFBWSxDQUFDO0FBQ2pCLGtCQUFNLFNBQVMsTUFBTSxRQUFRO0FBQUEsY0FDM0IsZUFBZTtBQUFBLGdCQUNiLFFBQVEsR0FBRyxNQUFNO0FBQ2YsOEJBQVk7QUFBQSxnQkFDZDtBQUFBLGNBQ0YsQ0FBQztBQUFBLFlBQ0gsQ0FBQyxFQUFFLFFBQVEsUUFBUSxFQUFFLE1BQU0sV0FBVyxRQUFRLENBQUM7QUFFL0MsbUJBQU87QUFBQSxjQUNMLFlBQVksRUFBRSxLQUFLLE9BQU8sSUFBSTtBQUFBLGNBQzlCLFVBQVUsV0FDUixXQUFXLE9BQ2IscUJBQXFCLEtBQUssVUFBVSxTQUFTLENBQUM7QUFBQSxZQUNoRDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0EsY0FBTTtBQUFBLFVBQ0osRUFBRSxRQUFRLGtCQUFrQixXQUFXLGFBQWE7QUFBQSxVQUNwRCxDQUFDLFVBQVU7QUFBQSxZQUNULE1BQU0sS0FBSyxLQUFLLEtBQUssWUFBWSxLQUFLLE1BQU0sa0JBQWtCO0FBQUEsWUFDOUQsV0FBVztBQUFBLFlBQ1gsWUFBWSxLQUFLO0FBQUEsVUFDbkI7QUFBQSxRQUNGO0FBQ0EsY0FBTTtBQUFBLFVBQ0osRUFBRSxRQUFRLHFCQUFxQixXQUFXLGFBQWE7QUFBQSxVQUN2RCxDQUFDLFVBQVU7QUFBQSxZQUNULFVBQVcsS0FBSyxXQUErQjtBQUFBLFlBQy9DLFFBQVE7QUFBQSxVQUNWO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUTs7O0FEOUVmLElBQU9BLHVCQUFRLGFBQWEsRUFBRSxHQUFHLG9CQUFXLENBQUM7IiwKICAibmFtZXMiOiBbInRzdXBfY29uZmlnX2RlZmF1bHQiXQp9Cg==
