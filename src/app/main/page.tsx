"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabase/client";
import _ from 'lodash';
import * as xlsx from "xlsx";
import styles from './main.module.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const incomeCategories = ["Зарплата", "Премия", "Подработка", "Проценты", "Другое"];
const expenseCategories = [
  "Рестораны",
  "Супермаркеты",
  "Транспорт",
  "Одежда",
  "Развлечения",
  "Коммунальные услуги",
  "Кредиты",
  "Другое",
];

interface IncomeExpense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "income" | "expense";
}
interface ExcelData {
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number | string;
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpense[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImportButtonEnabled, setIsImportButtonEnabled] = useState(false);
  const [activePage, setActivePage] = useState<'income' | 'expense'>('income');
  const [incomeData, setIncomeData] = useState< {
    amount: string;
    category: string;
    description: string;
    date: string;
  }>({
    amount: "",
    category: incomeCategories[0],
    description: "",
    date: new Date().toISOString().slice(0, 10), 
  });
  const [expenseData, setExpenseData] = useState< {
    amount: string;
    category: string;
    description: string;
    date: string;
  }>({
    amount: "",
    category: expenseCategories[0],
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [filterCriteria, setFilterCriteria] = useState<{
    date?: string;
    type?: "income" | "expense";
    category?: string;
    description?: string;
    amount?: string;
  }>({});
  const [filteredIncomeExpenses, setFilteredIncomeExpenses] = useState<IncomeExpense[]>([]);
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const headers = {
    en: ["Date", "Type", "Category", "Description", "Amount"],
    ru: ["Дата", "Тип", "Категория", "Описание", "Сумма"],
  };

  useEffect(() => {
    const fetchSessionAndData = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(sessionError.message || "Ошибка авторизации.");
          return;
        }

        if (sessionData.session) {
          setUserId(sessionData.session.user.id);
        } else {
          window.location.href = "/login";
          return;
        }
      } catch (error) {
        setError("Ошибка: " + error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndData();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          const { data: income, error: incomeError } = await supabase
            .from("incomes")
            .select("*")
            .eq("user_id", userId);

          const { data: expense, error: expenseError } = await supabase
            .from("expenses")
            .select("*")
            .eq("user_id", userId);

          if (incomeError || expenseError) {
            throw new Error(`Ошибка получения данных: ${incomeError?.message || expenseError?.message}`);
          }

          const combinedData = [
            ...(income || []).map((item: any) => ({ ...item, type: "income" })),
            ...(expense || []).map((item: any) => ({ ...item, type: "expense" })),
          ];

          setIncomeExpenses(combinedData);
          setTotalBalance(combinedData.reduce((sum, item) => (item.type === "income" ? sum + item.amount : sum - item.amount), 0));
        } catch (error) {
          setError(`Ошибка загрузки данных: ${error}`);
        }
      }
    };

    fetchData();
  }, [userId]);
  useEffect(() => {
    if (incomeExpenses.length > 0) {
        const filteredData = _.filter(incomeExpenses, item => {
            return (
                (!filterCriteria.date || item.date.includes(filterCriteria.date)) &&
                (!filterCriteria.type || item.type === filterCriteria.type) &&
                (!filterCriteria.category || item.category.includes(filterCriteria.category)) &&
                (!filterCriteria.description || item.description.includes(filterCriteria.description)) &&
                (!filterCriteria.amount || item.amount.toString().includes(filterCriteria.amount))
            );
        });
        setFilteredIncomeExpenses(filteredData);
    }
}, [incomeExpenses, filterCriteria]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterCriteria((prev) => ({ ...prev, [name]: value || undefined }));
  };
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      setError("Ошибка выхода из аккаунта.");
    }
  };
  const fetchIncomeExpenses = async () => {
    try {
      if (!userId) return; 

      const { data: income, error: incomeError } = await supabase
        .from("incomes")
        .select("*")
        .eq("user_id", userId);

      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId);


      if (incomeError || expenseError) {
        throw new Error(
          `Error fetching data: ${incomeError?.message || expenseError?.message}`
        );
      }

      const combinedData: IncomeExpense[] = [
        ...(income || []).map((item: any) => ({ ...item, type: "income" })),
        ...(expense || []).map((item: any) => ({ ...item, type: "expense" })),
      ];
      

      setIncomeExpenses(combinedData);
      setTotalBalance(
        combinedData.reduce((sum, item) => {
          return item.type === "income" ? sum + item.amount : sum - item.amount;
        }, 0)
      );
    } catch (error) {
      setError(`Ошибка загрузки данных: ${error}`);
    }
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setIncomeData((prev) => ({ ...prev, [name]: value }));
  };
  const uniqueCategories = [
    ...new Set([...incomeCategories, ...expenseCategories]),
  ];
  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExpenseData((prev) => ({ ...prev, [name]: value }));
  };

  const submitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("incomes")
        .insert([{ user_id: userId!, ...incomeData }]);
      if (error) throw error;
      console.log("Доход добавлен:", data);
      setIncomeData({ amount: "", category: incomeCategories[0], description: "", date: new Date().toISOString().slice(0, 10) });
      await fetchIncomeExpenses();
    } catch (error) {
      setError("Ошибка добавления дохода.");
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert([{ user_id: userId!, ...expenseData }]);
      if (error) throw error;
      console.log("Расход добавлен:", data);
      setExpenseData({ amount: "", category: expenseCategories[0], description: "", date: new Date().toISOString().slice(0, 10) });
      await fetchIncomeExpenses(); 
    } catch (error) {
      setError("Ошибка добавления расхода.");
    }
  };
  const exportToExcel = () => {
    const worksheetData: any[] = [
      ["Дата", "Тип", "Категория", "Описание", "Сумма"],
      ...filteredIncomeExpenses.map((item) => [
        item.date,
        item.type,
        item.category,
        item.description,
        item.amount,
      ]),
      ["", "", "", "Итоговый баланс:", filteredIncomeExpenses.reduce((sum, item) => item.type === "income" ? sum + item.amount : sum - item.amount, 0)],
    ];

    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Доходы и Расходы");
    xlsx.writeFile(workbook, "доходы_расходы.xlsx");
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file);
    setIsImportButtonEnabled(!!file);
  };
  const handleImportExcel = async (setError: React.Dispatch<React.SetStateAction<string | null>>, userId: string | null, fetchIncomeExpenses: () => Promise<void>) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';
    fileInput.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) {
            setError("Файл не выбран!");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (e: any) => {
            try {
                const data = new Uint8Array(e.target.result as ArrayBuffer);
                const workbook = xlsx.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = xlsx.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
  
                if (!jsonData || jsonData.length < 2) {
                    setError("Файл пуст или не содержит данных.");
                    return;
                }
  
                const headers = jsonData[0];
                const language = headers.some(header => /[а-яА-ЯЁё]/.test(header?.toString() || "")) ? 'ru' : 'en';
  
                const dataRows = jsonData.slice(1);
                const parsedData: ExcelData[] = dataRows.map((row: any[]) => {
                    if (row.length < 5) {
                        throw new Error("Недостаточно столбцов в строке.");
                    }
                    const amount = parseFloat(row[4]);
                    if (isNaN(amount)) {
                        throw new Error(`Некорректное значение amount: ${row[4]}`);
                    }
                    return {
                        date: row[0] || "",
                        type: row[1].toLowerCase() || "",
                        category: row[2] || "",
                        description: row[3] || "",
                        amount: amount,
                    };
                });
  
                const incomesToInsert = parsedData.filter(item => item.type === "income");
                const expensesToInsert = parsedData.filter(item => item.type === "expense");
  
                const insertData = async (table: string, data: ExcelData[]) => {
                    if (data.length > 0 && userId) {
                        const inserts = data.map(item => ({
                            user_id: userId,
                            date: item.date,
                            type: table === 'incomes' ? 'income' : 'expense',
                            category: item.category,
                            description: item.description,
                            amount: item.amount,
                        }));
                        await supabase.from(table).insert(inserts);
                    }
                }
  
                await insertData('incomes', incomesToInsert);
                await insertData('expenses', expensesToInsert);
                await fetchIncomeExpenses();
                setError("Данные успешно импортированы!");
  
            } catch (error: any) {
                setError(`Ошибка импорта: ${error.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
    };
    fileInput.click();
  };



  if (loading) return <p>Loading...</p>;
  if (error) return <div>Error: {error}</div>;

  
  ///График
  const prepareChartData = () => {
    if (!incomeExpenses.length) return [];

    const monthlyData: { [key: string]: { month: string; income: number; expense: number } } = {};

    incomeExpenses.forEach(item => {
      const date = new Date(item.date);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

      monthlyData[monthYear] = monthlyData[monthYear] || { month: monthYear, income: 0, expense: 0 };

      if (item.type === "income") {
        monthlyData[monthYear].income += item.amount;
      } else {
        monthlyData[monthYear].expense += item.amount;
      }
    });

    return Object.values(monthlyData);
  };

  const chartData = prepareChartData();


  const filteredIncome = filteredIncomeExpenses.filter(item => item.type === 'income');
  const filteredExpense = filteredIncomeExpenses.filter(item => item.type === 'expense');

  return (
    <div className={styles.container}>
    <div className={styles.section}>
        <button onClick={handleLogout} className={styles.button}>Выйти из аккаунта</button>
        <button onClick={exportToExcel} className={styles.button}>Экспорт в Excel</button>
<input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />          
<button onClick={handleImportExcel.bind(null, setError, userId, fetchIncomeExpenses)} disabled={!isImportButtonEnabled}>
          Импортировать
        </button>
    </div>
   
    <div className={styles.section}>
      <h1>Форма Дохода</h1>
      <form onSubmit={submitIncome}>
        <input type="number" name="amount" value={incomeData.amount} onChange={handleIncomeChange} placeholder="Сумма" />
        <select name="category" value={incomeData.category} onChange={handleIncomeChange}>
          {incomeCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input type="text" name="description" value={incomeData.description} onChange={handleIncomeChange} placeholder="Описание" />
        <input type="date" name="date" value={incomeData.date} onChange={handleIncomeChange} />
        <button type="submit">Добавить Доход</button>
      </form>
    </div>
    <div className={styles.section}>
      <h1>Форма Расхода</h1>
      <form onSubmit={submitExpense}>
        <input type="number" name="amount" value={expenseData.amount} onChange={handleExpenseChange} placeholder="Сумма" />
        <select name="category" value={expenseData.category} onChange={handleExpenseChange}>
          {expenseCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input type="text" name="description" value={expenseData.description} onChange={handleExpenseChange} placeholder="Описание" />
        <input type="date" name="date" value={expenseData.date} onChange={handleExpenseChange} />
        <button type="submit">Добавить Расход</button>
      </form>
    </div>
    <div className={`${styles.section} ${styles['table-section']}`}>
      <h1>Доходы и Расходы</h1>
      <div>
        <input type="date" name="date" value={filterCriteria.date || ""} onChange={handleFilterChange} placeholder="Дата" />
        <select name="type" value={filterCriteria.type || ""} onChange={handleFilterChange}>
          <option value="">Все</option>
          <option value="income">Доход</option>
          <option value="expense">Расход</option>
        </select>
        <select name="category" value={filterCriteria.category || ""} onChange={handleFilterChange}>
          <option value="">Все категории</option>
          {uniqueCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input type="text" name="description" value={filterCriteria.description || ""} onChange={handleFilterChange} placeholder="Описание" />
        <input type="text" name="amount" value={filterCriteria.amount || ""} onChange={handleFilterChange} placeholder="Сумма" />
      </div>
      <table className={styles['data-table']}>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Тип</th>
            <th>Категория</th>
            <th>Описание</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {filteredIncomeExpenses.map((item) => (
            <tr key={item.id} className={item.type === 'expense' ? styles.negative : ''}>
              <td>{item.date}</td>
              <td>{item.type}</td>
              <td>{item.category}</td>
              <td>{item.description}</td>
              <td>{item.type === "income" ? `+${item.amount}` : `-${item.amount}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Итоговый баланс: {totalBalance}</h2>
    </div>
    <div className={`${styles.section} ${styles['chart-section']}`}>
      <h2>График доходов и расходов</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          width={500}
          height={300}
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#8884d8" fill="#8884d8" />
          <Line type="monotone" dataKey="expense" stroke="#82ca9d" fill="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);
}