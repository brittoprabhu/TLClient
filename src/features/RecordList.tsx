import React, { useEffect, useState, useRef } from 'react';
import { Table, Pagination } from 'react-bootstrap';
import { FaTrash, FaExternalLinkAlt } from 'react-icons/fa'; // Import Trash and External Link icons
import axios from 'axios';
import agent from '../api/agent';
import DynamicForm from './DynamicForm';
import './RecordList.css';

interface optionlist {
    label: string;
    value: string;
}

interface Column {
    label: string;
    key: string;
    options: optionlist[];
}

interface Schema {
    columns: Column[];
}

interface Record {
    [key: string]: any;
}

const RecordList: React.FC<{ jsonFileName: string }> = ({ jsonFileName }) => {
    const [records, setRecords] = useState<Record[]>([]);
    const [recordId, setRecordId] = useState<string | null>(null);
    
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [itemsPerPage] = useState<number>(2);
    const [showForm, setShowForm] = useState(false);
    
    const [schema, setSchema] = useState<Schema | null>(null);

    const [isSchemaLoading, setIsSchemaLoading] = useState(false);
    
    // Ref to track if schema has been fetched
    
    const recordsFetchedRef = useRef<boolean>(false);

    const hasFetchedSchema = useRef(false);

useEffect(() => {
    const fetchSchemaOnce = async () => {
        if (isSchemaLoading || schema || hasFetchedSchema.current) {
            console.log("Schema fetch already in progress or already fetched, skipping...");
            return;
        }

        hasFetchedSchema.current = true; // Ensure it only fetches once

        setIsSchemaLoading(true); // Set loading to true before fetching

        try {
            console.log("Starting fetchSchema...");
            const urlSchema = `http://localhost:5173/${jsonFileName}`;
            const response = await axios.get(urlSchema);
            const transformedColumns = response.data.flatMap((section: any) =>
                section.fields.map((field: any) => ({
                    label: field.label,
                    key: field.name,
                    options: field.options
                }))
            );
            console.log("Schema fetched successfully:", transformedColumns);

            // Update state based on the fetched schema
            setSchema({ columns: transformedColumns });
        } catch (error) {
            console.error('Error fetching schema:', error);
        } finally {
            setIsSchemaLoading(false); // Set loading to false once done
        }
    };

    fetchSchemaOnce();
}, [schema, isSchemaLoading]); // Ensure dependencies are stable

const fetchRecords = async (page: number) => {
    if (loading || recordsFetchedRef.current) {
        console.warn("Fetch already in progress, skipping...");
        return;
    }

    recordsFetchedRef.current = true;
    try {
        console.log("Starting fetchRecords for page:", page);
        setLoading(true);
        const source = jsonFileName.split('/').pop()?.split('.')[0] || '';
        const response = await agent.Entities.listAll(source, page, itemsPerPage);
        setRecords(response.data.records || []);
        setTotalPages(Math.ceil(response.data.totalRecords / itemsPerPage));
        console.log("Records fetched successfully:", response.data.records);
    } catch (error) {
        console.error('Error fetching records:', error);
        setRecords([]);
    } finally {
        setLoading(false);
        recordsFetchedRef.current = false;
    }
};
    // Fetch records only when page changes and make sure it’s not being called twice
    useEffect(() => {
        
        if (loading || recordsFetchedRef.current) {
            console.warn("Fetch already in progress, skipping...");
            return;
        }
        fetchRecords(currentPage);
    }, [currentPage, jsonFileName]); // Fetch records on currentPage or jsonFileName change

    const handleCreate = () => {
        setRecordId(null);
        setShowForm(true); // Trigger to show the form for creating a new record
    };

    const handleEdit = (recordId: string) => {
        setRecordId(recordId);
        setShowForm(true);
    };

    const handleOpenInNewWindow = (recordId: string) => {
        console.log(`Open record in new window with ID: ${recordId}`);
        const windowUrl = `/dynamicform/${recordId}?jsonFileName=${encodeURIComponent(jsonFileName)}`;
        window.open(windowUrl, '_blank', 'width=800,height=600');
    };

    const renderActions = (record: Record) => (
        <div>
            <FaTrash
                style={{ cursor: 'pointer', color: 'red' }}
                onClick={() => handleDelete(record.id)}
                title="Delete"
            />
        </div>
    );

    const handleDelete = async (recordId: string) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await axios.delete(`/api/records/${recordId}`);
                setRecords(records.filter(record => record.id !== recordId));
            } catch (error) {
                console.error('Error deleting record:', error);
            }
        }
    };

    function getLabelByValue(options: { value: any }[], value: any): string | undefined {
        const option = options.find((opt) => opt.value === value);
        return option?.value;
    }

    // Callback to refetch records after creating a new one
    const handleNewRecordCreated = () => {
        fetchRecords(currentPage);
        setShowForm(false); // Optionally close the form after creation
    };

    if (loading) {
        return <div>Loading records...</div>;
    }

    if (!schema || !schema.columns || schema.columns.length === 0) {
        return <div>No columns available to display.</div>;
    }

    return (
        <div className="recordlist-container">
            <div className="recordlist">
                <button className="mb-3" onClick={handleCreate}>
                    Create New Record
                </button>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            {schema.columns.map(col => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length > 0 ? (
                            records.map((record, index) => (
                                <tr key={index}>
                                    {schema.columns.map(col => (
                                        <td key={col.key}>
                                            {col.options && Array.isArray(col.options) && (
                                                getLabelByValue(col.options, record[col.key])) }
                                            {col.key === 'name' ? (
                                                <div>
                                                    <a
                                                        href="#"
                                                        onClick={() => handleEdit(record.id)}
                                                        style={{ textDecoration: 'none', color: 'blue' }}
                                                    >
                                                        {record[col.key]}
                                                    </a>
                                                    <FaExternalLinkAlt
                                                        style={{
                                                            cursor: 'pointer',
                                                            color: 'blue',
                                                            marginLeft: '10px',
                                                        }}
                                                        onClick={() => handleOpenInNewWindow(record.id)}
                                                        title="Open in New Window"
                                                    />
                                                </div>
                                            ) : (
                                                record[col.key]
                                            )}
                                        </td>
                                    ))}
                                    <td>{renderActions(record)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={schema.columns.length + 1}>No records found.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
                <Pagination>
                    {Array.from({ length: totalPages }, (_, index) => (
                        <Pagination.Item
                            key={index}
                            active={index + 1 === currentPage}
                            onClick={() => setCurrentPage(index + 1)}
                        >
                            {index + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            </div>

            {showForm && (
                <div className="dynamicform">
                    <DynamicForm
                        jsonFileName={jsonFileName}
                        recordId={recordId ? recordId : undefined}
                        onNewRecordCreated={handleNewRecordCreated}
                    />
                </div>
            )}
        </div>
    );
};

export default RecordList;
