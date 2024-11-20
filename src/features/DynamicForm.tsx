import React, { useState, useEffect,  FormEvent } from 'react';
import { Form, Button, Row, Col, ListGroup } from 'react-bootstrap';
import agent from '../api/agent';
import './DynamicForm.css'; 

interface Option {
    label: string;
    value: string;
}

interface Field {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    autocompleteFrom?: string;
    options?: Option[];
}

interface Section {
    sectionTitle: string;
    fields: Field[];
}

interface DynamicFormProps {
    jsonFileName: string;
    recordId?: string; // Optional record ID for editing
    onNewRecordCreated: () => void; // Callback to notify parent of new record creation
}

const DynamicForm: React.FC<DynamicFormProps> = ({ jsonFileName, recordId, onNewRecordCreated }) => {
    const [schema, setSchema] = useState<Section[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [tableName, setTableName] = useState<string>('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [autocompleteData, setAutocompleteData] = useState<Option[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [currentFieldName, setCurrentFieldName] = useState<string>('');

    // Load schema on mount
    useEffect(() => {
        const fetchSchema = async () => {
            try {
                const response = await fetch(`/${jsonFileName}`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const tableName = jsonFileName.split('/').pop()?.split('.')[0] || '';
                const data = await response.json();
                setSchema(data);
                setTableName(tableName);
            } catch (error) {
                console.error('Error loading schema:', error);
            }
        };

        fetchSchema();
    }, [jsonFileName]);

    // Load record data for edit mode
    useEffect(() => {
        if (recordId && tableName) {
            const fetchRecord = async () => {
                try {
                    const response = await agent.Entities.getById(tableName, recordId);
                    const newFormData: Record<string, any> = {};

                    schema.forEach(section => {
                        section.fields.forEach(field => {
                            if (field.autocompleteFrom) {
                                newFormData[field.name] = response[field.name]; // Label
                                newFormData[`${field.name}`.replace("id","")] = response[`${field.name}`.replace("id","")]; // Value
                            } else {
                                newFormData[field.name] = response[field.name];
                            }
                        });
                    });

                    setFormData(newFormData);
                } catch (error) {
                    console.error('Error loading record:', error);
                }
            };

            fetchRecord();
        }
    }, [recordId, tableName, schema]);

    // Handle input change
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        const isAutocompleteField = schema
            .flatMap(section => section.fields)
            .some(f => f.name === name && f.autocompleteFrom);

        setFormData(prevData => ({
            ...prevData,
            [isAutocompleteField ? name.replace('id', '') : name]: value, // Update label field if autocomplete
            ...(isAutocompleteField ? { [name]: '' } : {}), // Clear ID if editing label directly
        }));

        if (isAutocompleteField && value) {
            const field = schema.flatMap(section => section.fields).find(f => f.name === name);
            if (field?.autocompleteFrom) {
                await fetchAutocompleteSuggestions(field.autocompleteFrom, value, name);
            }
        } else {
            setShowSuggestions(false);
        }
    };


    // Fetch autocomplete suggestions
    const fetchAutocompleteSuggestions = async (source: string, input: string, fieldName: string) => {
        try {
            const response = await agent.Entities.listbyname(source, input);
            const data = Array.isArray(response) ? response : [response];
            const options = data.map(item => ({
                label: item.name,
                value: item.id,
            }));

            setAutocompleteData(options);
            setCurrentFieldName(fieldName);
            setShowSuggestions(options.length > 0);
        } catch (error) {
            console.error('Error fetching autocomplete suggestions:', error);
        }
    };

    // Handle autocomplete selection
    const handleSelect = (option: Option) => {
        setFormData(prevData => ({
            ...prevData,
            [currentFieldName.replace('id', '')]: option.label, // Display value (label)
            [currentFieldName]: option.value, // Keep the ID in its original schema field
        }));

        setShowSuggestions(false);
        setCurrentFieldName('');
    };

    // Handle form validation
    const handleValidation = (): boolean => {
        let errors: Record<string, string> = {};
        let formIsValid = true;

        schema.forEach(section => {
            section.fields.forEach(field => {
                if (field.required && !formData[field.name]) {
                    formIsValid = false;
                    errors[field.name] = 'This field is required';
                }
            });
        });

        setFormErrors(errors);
        return formIsValid;
    };

    // Handle form submission
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (handleValidation()) {
            const submitData = { ...formData };

            Object.keys(submitData).forEach(key => {
                if (key.endsWith('_id')) {
                    const fieldName = key.replace('_id', '');
                    submitData[fieldName] = submitData[key];
                    delete submitData[key];
                }
            });


            // Remove fields that are not present in the schema
            Object.keys(submitData).forEach(key => {
                const fieldExistsInSchema = schema.some(section =>
                    section.fields.some(field => field.name === key)
                );
                if (!fieldExistsInSchema) {
                    delete submitData[key];
                }
            });




            if (recordId) {
                agent.Entities.update(tableName, recordId, submitData)
                    .then(() => {
                        console.log("Update successful, calling onNewRecordCreated");
                        onNewRecordCreated();
                    })
                    .catch(error => {
                        console.error("Error during update:", error);
                    });
            } else {
                agent.Entities.create(tableName, submitData)
                    .then(() => {
                        console.log("Create successful, calling onNewRecordCreated");
                        onNewRecordCreated();
                    })
                    .catch(error => {
                        console.error("Error during creation:", error);
                    });
            }
            
        }
    };

    // Render form fields
    const renderField = (field: Field) => {
        //const fieldValue = formData[field.name] || '';

        if (field.type === 'select') {
            return (
                <Form.Group className="mb-3" key={field.name}>
                    <Form.Label>{field.label}</Form.Label>
                    <Form.Control
                        as="select"
                        name={field.name}
                        onChange={handleChange}
                        required={field.required}
                        value={formData[field.name]}
                    >
                        <option value="">Select an option</option>
                        {field.options?.map((option, index) => (
                            <option key={index} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Form.Control>
                    {formErrors[field.name] && (
                        <div className="text-danger">{formErrors[field.name]}</div>
                    )}
                </Form.Group>
            );
        }

        return (
            <Form.Group className="mb-3 position-relative" key={field.name}>
                <Form.Label>{field.label}</Form.Label>
                <Form.Control
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    onChange={handleChange}
                    value={
                        field.autocompleteFrom
                            ? formData[field.name.replace('id', '')] || '' // Display label (editable field)
                            : formData[field.name] || '' // Non-autocomplete field
                    }
                    required={field.required}
                />
                {formErrors[field.name] && (
                    <div className="text-danger">{formErrors[field.name]}</div>
                )}
                {showSuggestions && currentFieldName === field.name && (
                    <ListGroup style={{ position: 'absolute', zIndex: 1 }}>
                        {autocompleteData.map((option, index) => (
                            <ListGroup.Item
                                key={index}
                                onClick={() => handleSelect(option)}
                                style={{ cursor: 'pointer' }}
                            >
                                {option.label}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Form.Group>
        );
    };

    return (
        <Form onSubmit={handleSubmit}>
            {schema.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                    <h3>{section.sectionTitle}</h3>
                    <Row>
                        {section.fields.map((field, fieldIndex) => (
                            <Col md={6} sm={12} key={fieldIndex}>
                                {renderField(field)}
                            </Col>
                        ))}
                    </Row>
                </div>
            ))}
            <Button type="submit">Submit</Button>
        </Form>
    );
};

export default DynamicForm;
