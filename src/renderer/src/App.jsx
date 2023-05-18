import axios from "axios";
import React, {useEffect, useState} from "react";
import {format, isSameDay} from 'date-fns';
import {fr} from 'date-fns/locale';

function App() {
  const [partsOfDays, setPartsOfDays] = useState([]);
  const [filteredScenario, setFilteredScenario] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:1337/api/parts-of-days?populate=*')
      .then((response) => {
        const partsOfDays = response.data.data.filter((partOfDay) =>
          isSameDay(new Date(partOfDay.attributes.day), new Date())
        );
        setPartsOfDays(partsOfDays);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const exportPartsOfDays = () => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayPartsOfDays = partsOfDays.filter(
      (partOfDay) => new Date(partOfDay.attributes.day).setHours(0, 0, 0, 0) === today
    );
    const exportData = todayPartsOfDays.map(
      (partOfDay) =>
        `${partOfDay.attributes.scenario.data.attributes.title}, ${partOfDay.attributes.room.data.attributes.name}, ${format(new Date(partOfDay.attributes.day), 'dd MMMM yyyy', {locale: fr})}, ${format(new Date(partOfDay.attributes.day), 'HH:mm', {locale: fr})}, ${partOfDay.attributes.status}\n`
    );
    const dataBlob = new Blob([exportData], {type: "text/plain"});
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export_games_today.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reloadPartsOfDays = () => {
    axios
      .get("http://localhost:1337/api/parts-of-days?populate=*")
      .then((response) => {
        const partsOfDays = response.data.data.filter((partOfDay) =>
          isSameDay(new Date(partOfDay.attributes.day), new Date())
        );
        setPartsOfDays(partsOfDays);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const zoomIn = () => {
    const container = document.querySelector(".container");
    const currentZoom = container.style.zoom || "100%";
    const newZoom = parseInt(currentZoom) + 10;
    container.style.zoom = `${newZoom}%`;
  };

  const zoomOut = () => {
    const container = document.querySelector(".container");
    const currentZoom = container.style.zoom || "100%";
    const newZoom = parseInt(currentZoom) - 10;
    container.style.zoom = `${newZoom}%`;
  };

  const stopPartOfDay = (partOfDayId) => {
    if (window.confirm("Are you sure you want to stop this part of day?")) {
      axios
        .delete(`http://localhost:1337/api/parts-of-days/${partOfDayId}`)
        .then(() => {
          reloadPartsOfDays();
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  const handleStatusChange = (partOfDayId, partOfDay) => {
    const updatedPartOfDay = {
      data: {
        id: partOfDayId,
        day: partOfDay.attributes.day,
        scenario: partOfDay.attributes.scenario,
        status: partOfDay.attributes.status === "not_started" ? "in_progress" : "completed",
      }
    };
    axios
      .put(`http://localhost:1337/api/parts-of-days/${partOfDayId}`, updatedPartOfDay)
      .then(() => {
        reloadPartsOfDays();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const restartParty = (partOfDayId, partOfDay) => {
    const updatedPartOfDay = {
      data: {
        id: partOfDayId,
        day: partOfDay.attributes.day,
        scenario: partOfDay.attributes.scenario,
        status: partOfDay.attributes.status = "not_started",
      }
    };
    axios
      .put(`http://localhost:1337/api/parts-of-days/${partOfDayId}`, updatedPartOfDay)
      .then(() => {
        reloadPartsOfDays();
      })
      .catch((error) => {
        console.error(error);
      });
  };


  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-purple-500 md:text-5xl lg:text-6xl dark:text-black text-center">
        Escape App
      </h1>

      <div className="flex justify-between items-center mb-8">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-red-700 border border-red-700 rounded-l-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-red-700"
            onClick={exportPartsOfDays}
          >
            Export
          </button>

          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-green-700 border-t border-b border-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
            onClick={reloadPartsOfDays}
          >
            Reload
          </button>
        </div>
      </div>

      <input
        type="text"
        value={filteredScenario}
        onChange={(e) => setFilteredScenario(e.target.value?.toLowerCase() || "")}
        placeholder="Filter by scenario..."
      />

      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Scenario
            </th>
            <th scope="col" className="px-6 py-3">
              Room
            </th>
            <th scope="col" className="px-6 py-3">
              Date
            </th>
            <th scope="col" className="px-6 py-3">
              Time
            </th>
            <th scope="col" className="px-6 py-3">
              Actions
            </th>
            <th scope="col" className="px-6 py-3">
              Delete
            </th>
          </tr>
          </thead>
          <tbody>
          {partsOfDays
            .filter((partOfDay) =>
              partOfDay.attributes.scenario.data.attributes.title?.toLowerCase().includes(filteredScenario)
            )
            .map((partOfDay) => (
              <tr key={partOfDay.id} className="bg-gray-100 dark:bg-gray-700">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {partOfDay.attributes.scenario.data.attributes.title}
                </td>
                <td className="px-6 py-4">{partOfDay.attributes.room.data.attributes.name}</td>
                <td className="px-6 py-4">
                  {format(new Date(partOfDay.attributes.day), "dd MMMM yyyy", { locale: fr })}
                </td>
                <td className="px-6 py-4">
                  {format(new Date(partOfDay.attributes.day), "HH:mm", { locale: fr })}
                </td>
                <td className="px-6 py-4">
                  {partOfDay.attributes.status === "not_started" ? (
                    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                      Start
                    </button>
                  ) : partOfDay.attributes.status === "in_progress" ? (
                    <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                      Stop
                    </button>
                  ) : (
                    <span className="text-green-600">Finish</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {partOfDay.attributes.status === "completed" ? (
                    <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                      Restart
                    </button>
                  ) : null}
                  <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>

  )
    ;
}

export default App;
