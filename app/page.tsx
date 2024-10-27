"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { biscuitBuddyFormSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Calendar as CalendarIcon, Download, IndianRupee, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

type FormValues = z.infer<typeof biscuitBuddyFormSchema>;

export default function Home() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showAdvancedPayment, setShowAdvancedPayment] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(biscuitBuddyFormSchema),
    defaultValues: {
      total_money: 0,
      date: new Date(),
      teamMembers: [{ name: "", advancedPayment: 0 }],
    },
  });

  

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "teamMembers",
  });

  const calculateShares = (values: FormValues) => {
    const totalAdvancedPayment = values.teamMembers.reduce((sum, member) => sum + (member.advancedPayment || 0), 0);
    const remainingMoney = values.total_money - totalAdvancedPayment;
    const sharePerMember = remainingMoney / values.teamMembers.length;

    const generatedInvoices = values.teamMembers.map((member) => ({
      name: member.name,
      advancedPayment: member.advancedPayment || 0,
      share: sharePerMember,
      totalToPay: Math.max(0, sharePerMember - (member.advancedPayment || 0)),
      date: values.date,
    }));

    setInvoices(generatedInvoices);
  };

  const generateInvoicePDF = (invoice: any) => {
    const pdf = new jsPDF();
  
    // Set background color (light beige)
    pdf.setFillColor(255, 248, 225);
    pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, 'F');
  
    // Add logo at the top, centered
    pdf.addImage("/images/snack-splitter-logo.png", "PNG", pdf.internal.pageSize.width / 2 - 25, 20, 50, 25); // Center the logo
  
    // Add title with modern font and underline
    pdf.setFontSize(26);
    pdf.setTextColor(34, 34, 34); // Dark gray
    pdf.setFont("helvetica", "bold");
    pdf.text("Biscuit Buddy Invoice", pdf.internal.pageSize.width / 2, 60, { align: "center" });
  
    // Add horizontal line separator
    pdf.setLineWidth(0.7);
    pdf.setDrawColor(200, 200, 200); // Light gray
    pdf.line(20, 65, pdf.internal.pageSize.width - 20, 65);
  
    // Add invoice details section with right and left alignment for clean look
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60); // Medium gray
    pdf.text(`Name: ${invoice.name}`, 20, 80);
    pdf.text(`Date: ${format(invoice.date, "PPP")}`, pdf.internal.pageSize.width - 80, 80); // Right aligned for date
  
    // Invoice details styling
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
  
    // Format the amounts without the ₹ symbol and add bold
    const formatCurrency = (amount: number) => `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  
    // Add a clear table with proper alignment for currency and text
    (pdf as any).autoTable({
      startY: 100,
      head: [["Description", "Amount"]],
      body: [
        ["Advanced Payment", formatCurrency(invoice.advancedPayment)],
        ["Share", formatCurrency(invoice.share)],
        [
          { content: "Total Amount to Pay", styles: { fontStyle: "bold" } },
          { content: formatCurrency(Math.max(0, invoice.share)), styles: { fontStyle: "bold" } }
        ],
      ],
      theme: 'striped',     
      headStyles: {
        fillColor: [245, 158, 11], // Yellow (amber-500)
        textColor: [255, 255, 255], // White text
        fontSize: 12,
      },
      bodyStyles: {
        halign: 'right', // Right-align numeric values
        fontSize: 12,
        fontStyle: 'bold', // Make amounts bold
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'normal' }, // Left-align text in the first column (description)
        1: { halign: 'right', fontStyle: 'bold' }, // Right-align amounts and make them bold
      },
      alternateRowStyles: { fillColor: [255, 248, 225] }, // Light yellow alternating rows
      margin: { top: 100, left: 20, right: 20 }, // Larger margins
      tableWidth: 'auto',
      styles: { overflow: 'linebreak' },
    });
  
    // Add footer with center alignment and a subtle note
    pdf.setFontSize(12);
    pdf.setTextColor(34, 34, 34); // Dark gray
    pdf.text("Thank you for using Biscuit Buddy!", pdf.internal.pageSize.width / 2, pdf.internal.pageSize.height - 30, { align: "center" });
  
    // Save the PDF
    pdf.save(`${invoice.name}_invoice.pdf`);
  };

  const downloadAllInvoices = () => {
    invoices.forEach((invoice) => generateInvoicePDF(invoice));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Card className="bg-white shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl font-bold text-white">Snack Splitter</CardTitle>
              <Image
                src="/images/snack-splitter-logo.png"
                alt="Snack Splitter Logo"
                width={100}
                height={100}
                className="rounded-full bg-white p-2"
              />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(calculateShares)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="total_money"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Total Snack Money</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input {...field} type="number" placeholder="Enter amount" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-purple-700">Snack Buddies</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Advanced Payment</span>
                      <Switch
                        checked={showAdvancedPayment}
                        onCheckedChange={setShowAdvancedPayment}
                      />
                    </div>
                  </div>
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
                      <div className="flex items-end space-x-4">
                        <FormField
                          control={form.control}
                          name={`teamMembers.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-grow">
                              <FormControl>
                                <Input {...field} placeholder={`Snack Buddy ${index + 1}`} className="bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {showAdvancedPayment && (
                          <FormField
                            control={form.control}
                            name={`teamMembers.${index}.advancedPayment`}
                            render={({ field }) => (
                              <FormItem className="flex-grow">
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input {...field} type="number" placeholder="Advanced" className="pl-10 bg-white" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="bg-red-500 hover:bg-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={() => append({ name: "", advancedPayment: 0, showAdvancedPayment: false })} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Snack Buddy
                  </Button>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                  Split Snacks and Generate Invoices
                </Button>
              </form>
            </Form>

            {invoices.length > 0 && (
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-purple-700">Snack Invoices</h2>
                  <Button onClick={downloadAllInvoices} className="bg-green-500 hover:bg-green-600 text-white">
                    <Download className="mr-2 h-4 w-4" /> Download All Invoices
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {invoices.map((invoice, index) => (
                    <Card key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 shadow-md">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-purple-700">{invoice.name}</h3>
                        <span className="text-sm text-gray-500">{format(invoice.date, "PPP")}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="flex justify-between">
                          <span>Advanced Payment:</span>
                          <span className="font-medium">${invoice.advancedPayment.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Share:</span>
                          <span className="font-medium">${invoice.share.toFixed(2)}</span>
                        </p>
                        <div className="border-t border-purple-200 pt-2 mt-2">
                          <p className="flex justify-between font-bold">
                            <span>Total Amount to Pay:</span>
                            <span>${invoice.totalToPay.toFixed(2)}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => generateInvoicePDF(invoice)}
                        className="mt-4 w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                      >
                        <Download className="mr-2 h-4 w-4" /> Generate Invoice PDF
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
