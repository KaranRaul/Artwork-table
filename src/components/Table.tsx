import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import axios from "axios";

interface Artwork {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: string;
    date_end: string;
}

const ArtworkTable: React.FC = () => {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]); // Must match DataTable value
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [rowsPerPage] = useState<number>(12);
    const [first, setFirst] = useState<number>(0);
    const [selectCount, setSelectCount] = useState<number>(0);
    const overlayPanelRef = useRef<OverlayPanel>(null);

    const fetchArtworks = async (page: number) => {
        setLoading(true);
        try {
            const response = await axios.get(`https://api.artic.edu/api/v1/artworks`, {
                params: { page },
            });
            setArtworks(response.data.data);
            setTotalRecords(response.data.pagination.total);
        } catch (error) {
            console.error("Error fetching artworks:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchArtworksForSelection = async (page: number) => {
        try {
            const response = await axios.get(`https://api.artic.edu/api/v1/artworks`, {
                params: { page },
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching artworks:", error);
        }
    };

    useEffect(() => {
        fetchArtworks(currentPage);
    }, [currentPage]);

    const onPageChange = (event: { first: number; rows: number; page?: number }) => {
        setCurrentPage((event.page || 0) + 1);
        setFirst(event.first);
    };

    const onSelectionChange = (e: { value: Artwork[] }) => {
        setSelectedArtworks(e.value);
    };

    const markNumberOfSelects = async (count: number) => {
        let tempPageCnt = currentPage;
        let pageCount = Math.floor(count / rowsPerPage);
        let remainingSelects = count % rowsPerPage;

        while (pageCount !== 0) {
            const currentArtWorks: Artwork[] = await fetchArtworksForSelection(tempPageCnt);
            setSelectedArtworks((prev) => [...prev, ...currentArtWorks]);
            pageCount--;
            tempPageCnt++;
        }

        if (remainingSelects !== 0) {
            const currentArtWorks = await fetchArtworksForSelection(tempPageCnt);
            setSelectedArtworks((prev) => [...prev, ...(currentArtWorks.slice(0, remainingSelects))]);
        }
    };

    const handleOverlaySubmit = () => {
        if (selectCount > 0) {
            markNumberOfSelects(selectCount);
            overlayPanelRef.current?.hide();
        }
    };

    return (
        <div>
            <div className="flex items-center mb-4">
                <h1 className="text-2xl font-bold">Artworks</h1>

                <OverlayPanel ref={overlayPanelRef} style={{ width: "20rem" }}>
                    <div className="flex flex-col items-start">
                        <label htmlFor="selectCount" className="mb-2 font-semibold">
                            Number of artworks to select:
                        </label>
                        <InputNumber
                            id="selectCount"
                            value={selectCount}
                            onValueChange={(e) => setSelectCount(e.value || 0)}
                            min={0}
                            className="mb-4 w-full"
                        />
                        <Button label="Submit" onClick={handleOverlaySubmit} className="w-full" />
                    </div>
                </OverlayPanel>
            </div>

            <DataTable
                value={artworks}
                selection={selectedArtworks}
                onSelectionChange={onSelectionChange}
                selectionMode="multiple"
                paginator
                rows={rowsPerPage}
                totalRecords={totalRecords}
                first={first}
                lazy
                loading={loading}
                tableStyle={{ minWidth: "60rem" }}
                onPage={onPageChange}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3em" }}></Column>
                <Column
                    field="title"
                    header={
                        <div className="flex items-center gap-2">
                            <Button
                                icon="pi pi-chevron-down"
                                className="p-button-text"
                                onClick={(e) => overlayPanelRef.current?.toggle(e)}
                            />
                            <span>Title</span>
                        </div>
                    }
                ></Column>
                <Column field="title" header="Title"></Column>
                <Column field="place_of_origin" header="Place of Origin"></Column>
                <Column field="artist_display" header="Artist"></Column>
                <Column field="inscriptions" header="Inscriptions"></Column>
                <Column field="date_start" header="Date Start"></Column>
                <Column field="date_end" header="Date End"></Column>
            </DataTable>
            <Button
                icon="pi pi-chevron-down"
                className="ml-4 p-button-text"
                onClick={(e) => overlayPanelRef.current?.toggle(e)}
            />



        </div>
    );
};

export default ArtworkTable;
