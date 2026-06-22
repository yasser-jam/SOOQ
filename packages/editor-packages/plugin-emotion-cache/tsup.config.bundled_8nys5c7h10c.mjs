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
var tsup_config_default2 = defineConfig(tsup_config_default);
export {
  tsup_config_default2 as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiLCAiLi4vdHN1cC1jb25maWcvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUveWFzc2VyLWphbWFsLWFsLWRlZW4vZ3JhZHVhdGlvbi1wcm9qZWN0L3Byb2plY3QvU09PUS9wYWNrYWdlcy9lZGl0b3ItcGFja2FnZXMvcGx1Z2luLWVtb3Rpb24tY2FjaGUvdHN1cC5jb25maWcudHNcIjtjb25zdCBfX2luamVjdGVkX2Rpcm5hbWVfXyA9IFwiL2hvbWUveWFzc2VyLWphbWFsLWFsLWRlZW4vZ3JhZHVhdGlvbi1wcm9qZWN0L3Byb2plY3QvU09PUS9wYWNrYWdlcy9lZGl0b3ItcGFja2FnZXMvcGx1Z2luLWVtb3Rpb24tY2FjaGVcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUveWFzc2VyLWphbWFsLWFsLWRlZW4vZ3JhZHVhdGlvbi1wcm9qZWN0L3Byb2plY3QvU09PUS9wYWNrYWdlcy9lZGl0b3ItcGFja2FnZXMvcGx1Z2luLWVtb3Rpb24tY2FjaGUvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidHN1cFwiO1xuaW1wb3J0IHRzdXBjb25maWcgZnJvbSBcIi4uL3RzdXAtY29uZmlnXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh0c3VwY29uZmlnKTtcbiIsICJjb25zdCBfX2luamVjdGVkX2ZpbGVuYW1lX18gPSBcIi9ob21lL3lhc3Nlci1qYW1hbC1hbC1kZWVuL2dyYWR1YXRpb24tcHJvamVjdC9wcm9qZWN0L1NPT1EvcGFja2FnZXMvZWRpdG9yLXBhY2thZ2VzL3RzdXAtY29uZmlnL2luZGV4LnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9ob21lL3lhc3Nlci1qYW1hbC1hbC1kZWVuL2dyYWR1YXRpb24tcHJvamVjdC9wcm9qZWN0L1NPT1EvcGFja2FnZXMvZWRpdG9yLXBhY2thZ2VzL3RzdXAtY29uZmlnXCI7Y29uc3QgX19pbmplY3RlZF9pbXBvcnRfbWV0YV91cmxfXyA9IFwiZmlsZTovLy9ob21lL3lhc3Nlci1qYW1hbC1hbC1kZWVuL2dyYWR1YXRpb24tcHJvamVjdC9wcm9qZWN0L1NPT1EvcGFja2FnZXMvZWRpdG9yLXBhY2thZ2VzL3RzdXAtY29uZmlnL2luZGV4LnRzXCI7aW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBwb3N0Y3NzIGZyb20gXCJwb3N0Y3NzXCI7XG5pbXBvcnQgcG9zdGNzc01vZHVsZXMgZnJvbSBcInBvc3Rjc3MtbW9kdWxlc1wiO1xuaW1wb3J0IHR5cGUgeyBPcHRpb25zIH0gZnJvbSBcInRzdXBcIjtcblxuY29uc3QgY29uZmlnOiBPcHRpb25zID0ge1xuICBkdHM6IHRydWUsXG4gIGZvcm1hdDogW1wiY2pzXCIsIFwiZXNtXCJdLFxuICBpbmplY3Q6IFtcIi4uL3RzdXAtY29uZmlnL3JlYWN0LWltcG9ydC5qc1wiXSxcbiAgZXh0ZXJuYWw6IFtcbiAgICBcInJlYWN0XCIsXG4gICAgXCJyZWFjdC1kb21cIixcbiAgICBcIkBwdWNrZWRpdG9yL2NvcmVcIixcbiAgICBcIkBkbmQta2l0L3JlYWN0XCIsXG4gICAgXCJAZG5kLWtpdC9kb21cIixcbiAgICBcIkBkbmQta2l0L2Fic3RyYWN0XCIsXG4gICAgXCJAZG5kLWtpdC9zdGF0ZVwiLFxuICAgIFwiQGRuZC1raXQvZ2VvbWV0cnlcIixcbiAgICBcIkBkbmQta2l0L3V0aWxpdGllc1wiLFxuICBdLFxuICBlc2J1aWxkUGx1Z2luczogW1xuICAgIHtcbiAgICAgIG5hbWU6IFwiY3NzLW1vZHVsZVwiLFxuICAgICAgc2V0dXAoYnVpbGQpOiB2b2lkIHtcbiAgICAgICAgYnVpbGQub25SZXNvbHZlKFxuICAgICAgICAgIHsgZmlsdGVyOiAvXFwubW9kdWxlXFwuY3NzJC8sIG5hbWVzcGFjZTogXCJmaWxlXCIgfSxcbiAgICAgICAgICAoYXJncykgPT4gKHtcbiAgICAgICAgICAgIHBhdGg6IGAke3BhdGguam9pbihhcmdzLnJlc29sdmVEaXIsIGFyZ3MucGF0aCl9I2Nzcy1tb2R1bGVgLFxuICAgICAgICAgICAgbmFtZXNwYWNlOiBcImNzcy1tb2R1bGVcIixcbiAgICAgICAgICAgIHBsdWdpbkRhdGE6IHtcbiAgICAgICAgICAgICAgcGF0aERpcjogcGF0aC5qb2luKGFyZ3MucmVzb2x2ZURpciwgYXJncy5wYXRoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgICAgYnVpbGQub25Mb2FkKFxuICAgICAgICAgIHsgZmlsdGVyOiAvI2Nzcy1tb2R1bGUkLywgbmFtZXNwYWNlOiBcImNzcy1tb2R1bGVcIiB9LFxuICAgICAgICAgIGFzeW5jIChhcmdzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IHBsdWdpbkRhdGEgfSA9IGFyZ3MgYXMge1xuICAgICAgICAgICAgICBwbHVnaW5EYXRhOiB7IHBhdGhEaXI6IHN0cmluZyB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3Qgc291cmNlID0gZnMucmVhZEZpbGVTeW5jKHBsdWdpbkRhdGEucGF0aERpciwgXCJ1dGY4XCIpO1xuXG4gICAgICAgICAgICBsZXQgY3NzTW9kdWxlID0ge307XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb3N0Y3NzKFtcbiAgICAgICAgICAgICAgcG9zdGNzc01vZHVsZXMoe1xuICAgICAgICAgICAgICAgIGdldEpTT04oXywganNvbikge1xuICAgICAgICAgICAgICAgICAgY3NzTW9kdWxlID0ganNvbjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIF0pLnByb2Nlc3Moc291cmNlLCB7IGZyb206IHBsdWdpbkRhdGEucGF0aERpciB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgcGx1Z2luRGF0YTogeyBjc3M6IHJlc3VsdC5jc3MgfSxcbiAgICAgICAgICAgICAgY29udGVudHM6IGBpbXBvcnQgXCIke1xuICAgICAgICAgICAgICAgIHBsdWdpbkRhdGEucGF0aERpclxuICAgICAgICAgICAgICB9XCI7IGV4cG9ydCBkZWZhdWx0ICR7SlNPTi5zdHJpbmdpZnkoY3NzTW9kdWxlKX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIGJ1aWxkLm9uUmVzb2x2ZShcbiAgICAgICAgICB7IGZpbHRlcjogL1xcLm1vZHVsZVxcLmNzcyQvLCBuYW1lc3BhY2U6IFwiY3NzLW1vZHVsZVwiIH0sXG4gICAgICAgICAgKGFyZ3MpID0+ICh7XG4gICAgICAgICAgICBwYXRoOiBwYXRoLmpvaW4oYXJncy5yZXNvbHZlRGlyLCBhcmdzLnBhdGgsIFwiI2Nzcy1tb2R1bGUtZGF0YVwiKSxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogXCJjc3MtbW9kdWxlXCIsXG4gICAgICAgICAgICBwbHVnaW5EYXRhOiBhcmdzLnBsdWdpbkRhdGEgYXMgeyBjc3M6IHN0cmluZyB9LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICAgIGJ1aWxkLm9uTG9hZChcbiAgICAgICAgICB7IGZpbHRlcjogLyNjc3MtbW9kdWxlLWRhdGEkLywgbmFtZXNwYWNlOiBcImNzcy1tb2R1bGVcIiB9LFxuICAgICAgICAgIChhcmdzKSA9PiAoe1xuICAgICAgICAgICAgY29udGVudHM6IChhcmdzLnBsdWdpbkRhdGEgYXMgeyBjc3M6IHN0cmluZyB9KS5jc3MsXG4gICAgICAgICAgICBsb2FkZXI6IFwiY3NzXCIsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc2MsU0FBUyxvQkFBb0I7OztBQ0FwRSxPQUFPLFFBQVE7QUFDOWEsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sYUFBYTtBQUNwQixPQUFPLG9CQUFvQjtBQUczQixJQUFNLFNBQWtCO0FBQUEsRUFDdEIsS0FBSztBQUFBLEVBQ0wsUUFBUSxDQUFDLE9BQU8sS0FBSztBQUFBLEVBQ3JCLFFBQVEsQ0FBQyxnQ0FBZ0M7QUFBQSxFQUN6QyxVQUFVO0FBQUEsSUFDUjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0EsZ0JBQWdCO0FBQUEsSUFDZDtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sTUFBTSxPQUFhO0FBQ2pCLGNBQU07QUFBQSxVQUNKLEVBQUUsUUFBUSxrQkFBa0IsV0FBVyxPQUFPO0FBQUEsVUFDOUMsQ0FBQyxVQUFVO0FBQUEsWUFDVCxNQUFNLEdBQUcsS0FBSyxLQUFLLEtBQUssWUFBWSxLQUFLLElBQUksQ0FBQztBQUFBLFlBQzlDLFdBQVc7QUFBQSxZQUNYLFlBQVk7QUFBQSxjQUNWLFNBQVMsS0FBSyxLQUFLLEtBQUssWUFBWSxLQUFLLElBQUk7QUFBQSxZQUMvQztBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0EsY0FBTTtBQUFBLFVBQ0osRUFBRSxRQUFRLGdCQUFnQixXQUFXLGFBQWE7QUFBQSxVQUNsRCxPQUFPLFNBQVM7QUFDZCxrQkFBTSxFQUFFLFdBQVcsSUFBSTtBQUl2QixrQkFBTSxTQUFTLEdBQUcsYUFBYSxXQUFXLFNBQVMsTUFBTTtBQUV6RCxnQkFBSSxZQUFZLENBQUM7QUFDakIsa0JBQU0sU0FBUyxNQUFNLFFBQVE7QUFBQSxjQUMzQixlQUFlO0FBQUEsZ0JBQ2IsUUFBUSxHQUFHLE1BQU07QUFDZiw4QkFBWTtBQUFBLGdCQUNkO0FBQUEsY0FDRixDQUFDO0FBQUEsWUFDSCxDQUFDLEVBQUUsUUFBUSxRQUFRLEVBQUUsTUFBTSxXQUFXLFFBQVEsQ0FBQztBQUUvQyxtQkFBTztBQUFBLGNBQ0wsWUFBWSxFQUFFLEtBQUssT0FBTyxJQUFJO0FBQUEsY0FDOUIsVUFBVSxXQUNSLFdBQVcsT0FDYixxQkFBcUIsS0FBSyxVQUFVLFNBQVMsQ0FBQztBQUFBLFlBQ2hEO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFDQSxjQUFNO0FBQUEsVUFDSixFQUFFLFFBQVEsa0JBQWtCLFdBQVcsYUFBYTtBQUFBLFVBQ3BELENBQUMsVUFBVTtBQUFBLFlBQ1QsTUFBTSxLQUFLLEtBQUssS0FBSyxZQUFZLEtBQUssTUFBTSxrQkFBa0I7QUFBQSxZQUM5RCxXQUFXO0FBQUEsWUFDWCxZQUFZLEtBQUs7QUFBQSxVQUNuQjtBQUFBLFFBQ0Y7QUFDQSxjQUFNO0FBQUEsVUFDSixFQUFFLFFBQVEscUJBQXFCLFdBQVcsYUFBYTtBQUFBLFVBQ3ZELENBQUMsVUFBVTtBQUFBLFlBQ1QsVUFBVyxLQUFLLFdBQStCO0FBQUEsWUFDL0MsUUFBUTtBQUFBLFVBQ1Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFROzs7QUQ5RWYsSUFBT0EsdUJBQVEsYUFBYSxtQkFBVTsiLAogICJuYW1lcyI6IFsidHN1cF9jb25maWdfZGVmYXVsdCJdCn0K
